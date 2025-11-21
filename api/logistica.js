// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js 
// ------------------------------------------------------------
// Fluxo da logística após a confirmação da adoção (Mailjet):
//
// 1) RECEBER PRESENTE  (acao="receber")
//    RECEBER → muda para "presente recebido" + e-mail ADMIN
//    → muda status para "presente recebido"
//    → cria movimento no ponto
//    → envia e-mail ao ADMIN (Mailjet)
//
// 2) COLETAR / RETIRAR PRESENTE  (acao="coletar" OU "retirar")
//    COLETAR/RETIRAR → muda para "presente entregue" + e-mail DOADOR
//    → muda status para "presente entregue"
//    → cria movimento no ponto
//    → envia e-mail ao DOADOR (Mailjet)
//
// IMPORTANTE:
// Se o e-mail falhar → NÃO muda status e NÃO cria movimento.
// Compatível com as tabelas reais enviadas por Carina Mendes
// adocoes → usuario, cartinha, pontos_coleta, id_doacao, status_adocao
// ponto_movimentos → id_movimentacao_ponto, id_ponto, adocoes (link),
//                     tipo_movimento, data_movimento, responsavel,
//                     observacoes, foto_presente (opcional), registrado_por...
// ------------------------------------------------------------
// RECEBER → Envia e-mail ao ADMIN (Mailjet Template MAILJET_TEMPLATE_ID_ENTREGA)
// COLETAR/RETIRAR → Envia e-mail ao DOADOR (Mailjet Template MAILJET_TEMPLATE_ID_RECEBIDO)
// ------------------------------------------------------------
// Requisitos (.env):
//  MAILJET_API_KEY
//  MAILJET_SECRET_KEY
//  MAILJET_FROM_EMAIL
//  MAILJET_FROM_NAME
//  MAILJET_TEMPLATE_ID_ENTREGA   (template "Presente Recebido" - ADMIN)
//  MAILJET_TEMPLATE_ID_RECEBIDO  (template "Presente Coletado" - DOADOR)
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// Tabelas
const TB_ADOCOES  = "adocoes";
const TB_USUARIOS = "usuario";
const TB_CARTINHAS = "cartinha";
const TB_PONTOS   = "pontos_coleta";
const TB_MOV      = "ponto_movimentos";
const TB_EVENTOS  = "eventos";

// Nome do campo de link na tabela ponto_movimentos → adocoes (link para adoções)
const FIELD_ADOCOES_LINK = "adocoes";

// ============================================================
// 🔐 Função auxiliar para autenticação Mailjet
// ============================================================
function getMailjetAuthHeader() {
  const key = process.env.MAILJET_API_KEY;
  const secret = process.env.MAILJET_SECRET_KEY;
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return "Basic " + token;
}

// ============================================================
// 📌 Email ADMIN — Template MAILJET_TEMPLATE_ID_ENTREGA
//     (Presente RECEBIDO no ponto)
// ============================================================
async function enviarEmailAdmin_Recebimento(data) {
  try {
    const payload = {
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME
          },
          // Envia para o e-mail oficial do Varal (from) — pode adicionar outros depois
          To: [
            {
              Email: process.env.MAILJET_FROM_EMAIL,
              Name: "Equipe Logística"
            }
          ],
          TemplateID: Number(process.env.MAILJET_TEMPLATE_ID_ENTREGA),
          TemplateLanguage: true,
          Subject: "📦 Presente Recebido no Ponto de Coleta!",
          Variables: {
            // Variáveis usadas no template do Mailjet
            ponto_nome:   data.ponto_nome,
            nome_crianca: data.nome_crianca,
            nome_doador:  data.nome_doador,
            id_doacao:    data.id_doacao
          }
        }
      ]
    };

    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getMailjetAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("❌ Mailjet ADMIN response:", txt);
    }

    return r.ok;
  } catch (err) {
    console.error("🔥 ERRO EMAIL ADMIN:", err);
    return false;
  }
}

// ============================================================
// 📌 Email DOADOR — Template MAILJET_TEMPLATE_ID_RECEBIDO
//     (Presente COLETADO / a caminho do evento)
// ============================================================
async function enviarEmailDoador_Entrega(data) {
  try {
    const payload = {
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME
          },
          To: [
            {
              Email: data.email_doador,
              Name: data.nome_doador
            }
          ],
          TemplateID: Number(process.env.MAILJET_TEMPLATE_ID_RECEBIDO),
          TemplateLanguage: true,
          Subject: "🎁 Seu presente foi coletado e está a caminho do evento!",
          Variables: {
            // Variáveis usadas no template do Mailjet (texto do e-mail)
            donor_name:    data.nome_doador,
            child_name:    data.nome_crianca,
            child_gift:    data.sonho,
            order_id:      data.id_doacao,
            pickup_name:   data.ponto_nome,
            pickup_address:data.ponto_endereco,
            pickup_phone:  data.ponto_telefone,
            event_name:    data.evento_nome,
            event_date:    data.evento_data
          }
        }
      ]
    };

    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getMailjetAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("❌ Mailjet DOADOR response:", txt);
    }

    return r.ok;
  } catch (err) {
    console.error("🔥 ERRO EMAIL DOADOR:", err);
    return false;
  }
}

// ============================================================
// 🌟 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Use POST." });
  }

  // Compatível com painel-admin e painel-ponto
  const {
    acao,             // "receber", "coletar" ou "retirar"
    id_registro,      // recordId da adoção (usado no admin)
    id_adocao,        // recordId da adoção (usado no painel do ponto)
    id_ponto,         // opcional (no painel do ponto já vem)
    responsavel,
    observacoes,
    foto,             // URL opcional da foto
    data_movimento    // data opcional informada pelo ponto (YYYY-MM-DD)
  } = req.body || {};

  if (!acao || (!id_registro && !id_adocao)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Campos obrigatórios ausentes (acao, id_registro/id_adocao)."
    });
  }

  const idAdocao = id_registro || id_adocao;

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // --------------------------------------------------------
    // 1. Buscar adoção + dados relacionados
    // --------------------------------------------------------
    const ado = await base(TB_ADOCOES).find(idAdocao);
    const f = ado.fields;

    const id_doacao = f.id_doacao; // Autonumber da adoção (campo de exibição)
    const usuarioId  = f.usuario?.[0];
    const cartinhaId = f.cartinha?.[0];
    const pontoId    = id_ponto || f.pontos_coleta?.[0]; // prioriza o que vem no body

    if (!usuarioId || !cartinhaId || !pontoId) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Registros relacionados incompletos (usuario/cartinha/ponto)."
      });
    }

    const [user, cart, ponto] = await Promise.all([
      base(TB_USUARIOS).find(usuarioId),
      base(TB_CARTINHAS).find(cartinhaId),
      base(TB_PONTOS).find(pontoId)
    ]);

    const nomeCrianca = cart?.fields?.nome_crianca || "";
    const sonho       = cart?.fields?.sonho || "";
    const nomeDoador  = user?.fields?.nome_usuario || "";
    const emailDoador = user?.fields?.email_usuario || "";

    const pontoNome     = ponto?.fields?.nome_ponto || "";
    const pontoEndereco = ponto?.fields?.endereco || "";
    const pontoTelefone = ponto?.fields?.telefone || "";

    // --------------------------------------------------------
    // 2. Buscar evento em andamento (para e-mail doador)
    // --------------------------------------------------------
    const eventos = await base(TB_EVENTOS)
      .select({ filterByFormula: `status_evento='em andamento'` })
      .firstPage();

    const evento      = eventos[0]?.fields || {};
    const eventoNome  = evento.nome_evento || "Evento Solidário 💙";
    const eventoData  = evento.data_realizacao_evento || "-";

    // --------------------------------------------------------
    // 3. Preparar dados comuns do movimento
    // --------------------------------------------------------
    const hojeISO = new Date().toISOString().split("T")[0];
    const dataMov = data_movimento || hojeISO;

    // Monta campo de foto (attachment) apenas se vier URL
    const camposFoto =
      foto && typeof foto === "string"
        ? { foto_presente: [{ url: foto }] }
        : {};

    // ============================================================
    // 1️⃣ RECEBER — e-mail ADMIN + movimento "recebimento"
    // ============================================================
    if (acao === "receber") {
      const enviado = await enviarEmailAdmin_Recebimento({
        ponto_nome:   pontoNome,
        nome_crianca: nomeCrianca,
        nome_doador:  nomeDoador,
        id_doacao
      });

      if (!enviado) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao enviar e-mail ao ADMIN."
        });
      }

      // Atualiza status da adoção
      await base(TB_ADOCOES).update(idAdocao, {
        status_adocao: "presente recebido"
      });

      // Registra movimentação no ponto_movimentos
      await base(TB_MOV).create([
        {
          fields: {
            id_ponto: [pontoId],
            [FIELD_ADOCOES_LINK]: [idAdocao],
            tipo_movimento: "recebimento",
            data_movimento: dataMov,
            responsavel: responsavel || "Não informado",
            observacoes: observacoes || "",
            registrado_por: "painel-logistica",
            ...camposFoto
          }
        }
      ]);

      return res.json({
        sucesso: true,
        mensagem: "Presente marcado como RECEBIDO"
      });
    }

    // ============================================================
    // 2️⃣ COLETAR / RETIRAR — e-mail DOADOR + movimento "retirada"
    //      (aceita 'coletar' para o admin e 'retirar' para o ponto)
// ============================================================
    if (acao === "coletar" || acao === "retirar") {
      const enviado = await enviarEmailDoador_Entrega({
        nome_doador:  nomeDoador,
        email_doador: emailDoador,
        nome_crianca: nomeCrianca,
        sonho,
        id_doacao,
        ponto_nome:     pontoNome,
        ponto_endereco: pontoEndereco,
        ponto_telefone: pontoTelefone,
        evento_nome:    eventoNome,
        evento_data:    eventoData
      });

      if (!enviado) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao enviar e-mail ao DOADOR."
        });
      }

      // Atualiza status da adoção
      await base(TB_ADOCOES).update(idAdocao, {
        status_adocao: "presente entregue"
      });

      // Registra movimentação no ponto_movimentos
      await base(TB_MOV).create([
        {
          fields: {
            id_ponto: [pontoId],
            [FIELD_ADOCOES_LINK]: [idAdocao],
            tipo_movimento: "retirada",
            data_movimento: dataMov,
            responsavel: responsavel || "Não informado",
            observacoes: observacoes || "",
            registrado_por: "painel-logistica",
            ...camposFoto
          }
        }
      ]);

      return res.json({
        sucesso: true,
        mensagem: "Presente marcado como ENTREGUE"
      });
    }

    // --------------------------------------------------------
    // Ação desconhecida
    // --------------------------------------------------------
    return res.status(400).json({
      sucesso: false,
      mensagem: "Ação inválida. Use 'receber', 'coletar' ou 'retirar'."
    });

  } catch (err) {
    console.error("🔥 ERRO LOGISTICA:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno.",
      detalhe: err.message
    });
  }
}
