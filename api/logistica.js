// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js 
// ------------------------------------------------------------
// Fluxo da logística após a confirmação da adoção Mailjet:
//
// 1) RECEBER PRESENTE  (acao="receber")
//    RECEBER → muda para "presente recebido" + email ADMIN
//    → muda status para "presente recebido"
//    → cria movimento no ponto
//    → envia e-mail ao ADMIN (Mailjet)
//
// 2) COLETAR PRESENTE  (acao="coletar")
//    COLETAR → muda para "presente entregue" + email DOADOR
//    → muda status para "presente entregue"
//    → cria movimento no ponto
//    → envia e-mail ao DOADOR (Mailjet)
//
// IMPORTANTE:
// Se o e-mail falhar → NÃO muda status e retorna erro.
// Compatível com as tabelas reais enviadas por Carina Mendes
// adocoes → usuario, cartinha, pontos_coleta, id_doacao, status_adocao
// pontos_movimentos → id_ponto, id_doacao, tipo_movimento, data...
// ------------------------------------------------------------
// RECEBER → Envia e-mail ao ADMIN (Mailjet Template 7473367)
// COLETAR → Envia e-mail ao DOADOR (Mailjet Template 7512791)
// ------------------------------------------------------------
// Requisitos:
//  MAILJET_API_KEY
//  MAILJET_SECRET_KEY
//  MAILJET_FROM_EMAIL
//  MAILJET_FROM_NAME
//  MAILJET_TEMPLATE_ID_ENTREGA    (7473367)
//  MAILJET_TEMPLATE_ID_RECEBIDO   (7512791)
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// Tabelas
const TB_ADOCOES = "adocoes";
const TB_USUARIOS = "usuario";
const TB_CARTINHAS = "cartinha";
const TB_PONTOS = "pontos_coleta";
const TB_MOV = "ponto_movimentos";
const TB_EVENTOS = "eventos";

// ============================================================
// 📌 Email ADMIN — Template 7473367 (Presente Recebido)
// ============================================================
async function enviarEmailAdmin_Recebimento(data) {
  try {
    const payload = {
      Messages: [
        {
          From: { Email: process.env.MAILJET_FROM_EMAIL, Name: process.env.MAILJET_FROM_NAME },
          To: [{ Email: process.env.MAILJET_FROM_EMAIL, Name: "Equipe Logística" }],
          TemplateID: Number(process.env.MAILJET_TEMPLATE_ID_ENTREGA),
          TemplateLanguage: true,
          Subject: "📦 Presente Recebido no Ponto de Coleta!",
          Variables: {
            ponto_nome: data.ponto_nome,
            nome_crianca: data.nome_crianca,
            nome_doador: data.nome_doador,
            id_doacao: data.id_doacao
          }
        }
      ]
    };

    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString("base64")
      },
      body: JSON.stringify(payload)
    });

    return r.ok;
  } catch (err) {
    console.error("🔥 ERRO EMAIL ADMIN:", err);
    return false;
  }
}

// ============================================================
// 📌 Email DOADOR — Template 7512791 (Presente Coletado)
// ============================================================
async function enviarEmailDoador_Entrega(data) {
  try {
    const payload = {
      Messages: [
        {
          From: { Email: process.env.MAILJET_FROM_EMAIL, Name: process.env.MAILJET_FROM_NAME },
          To: [{ Email: data.email_doador, Name: data.nome_doador }],
          TemplateID: Number(process.env.MAILJET_TEMPLATE_ID_RECEBIDO),
          TemplateLanguage: true,
          Subject: "🎁 Seu presente foi coletado e está a caminho do evento!",
          Variables: {
            donor_name: data.nome_doador,
            child_name: data.nome_crianca,
            child_gift: data.sonho,
            order_id: data.id_doacao,
            pickup_name: data.ponto_nome,
            pickup_address: data.ponto_endereco,
            pickup_phone: data.ponto_telefone,
            event_name: data.evento_nome,
            event_date: data.evento_data
          }
        }
      ]
    };

    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString("base64")
      },
      body: JSON.stringify(payload)
    });

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

  const { acao, id_registro, responsavel, observacoes } = req.body;

  if (!acao || !id_registro) {
    return res.status(400).json({ sucesso: false, mensagem: "Campos ausentes." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    const ado = await base(TB_ADOCOES).find(id_registro);
    const f = ado.fields;

    const id_doacao = f.id_doacao;
    const usuarioId = f.usuario?.[0];
    const cartinhaId = f.cartinha?.[0];
    const pontoId = f.pontos_coleta?.[0];

    const user = await base(TB_USUARIOS).find(usuarioId);
    const cart = await base(TB_CARTINHAS).find(cartinhaId);
    const ponto = await base(TB_PONTOS).find(pontoId);

    const nomeCrianca = cart?.fields?.nome_crianca || "";
    const sonho = cart?.fields?.sonho || "";
    const nomeDoador = user?.fields?.nome_usuario || "";
    const emailDoador = user?.fields?.email_usuario || "";

    const pontoNome = ponto?.fields?.nome_ponto || "";
    const pontoEndereco = ponto?.fields?.endereco || "";
    const pontoTelefone = ponto?.fields?.telefone || "";

    const eventos = await base(TB_EVENTOS).select({ filterByFormula: `status_evento='em andamento'` }).firstPage();
    const evento = eventos[0]?.fields || {};

    const eventoNome = evento.nome_evento || "Evento Solidário 💙";
    const eventoData = evento.data_realizacao_evento || "-";

    // ============================================================
    // 1️⃣ RECEBER — email ADMIN
    // ============================================================
    if (acao === "receber") {
      const enviado = await enviarEmailAdmin_Recebimento({
        ponto_nome: pontoNome,
        nome_crianca: nomeCrianca,
        nome_doador: nomeDoador,
        id_doacao
      });

      if (!enviado) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar email ao ADMIN." });
      }

      await base(TB_ADOCOES).update(id_registro, { status_adocao: "presente recebido" });

      await base(TB_MOV).create({
        id_ponto: [pontoId],
        id_doacao: id_doacao,
        tipo_movimento: "recebimento",
        responsavel,
        observacoes,
        data: new Date().toISOString()
      });

      return res.json({ sucesso: true, mensagem: "Presente marcado como RECEBIDO" });
    }

    // ============================================================
    // 2️⃣ COLETAR — email DOADOR
    // ============================================================
    if (acao === "coletar") {
      const enviado = await enviarEmailDoador_Entrega({
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: nomeCrianca,
        sonho,
        id_doacao,
        ponto_nome: pontoNome,
        ponto_endereco: pontoEndereco,
        ponto_telefone: pontoTelefone,
        evento_nome: eventoNome,
        evento_data: eventoData
      });

      if (!enviado) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar email ao DOADOR." });
      }

      await base(TB_ADOCOES).update(id_registro, { status_adocao: "presente entregue" });

      await base(TB_MOV).create({
        id_ponto: [pontoId],
        id_doacao: id_doacao,
        tipo_movimento: "retirada",
        responsavel,
        observacoes,
        data: new Date().toISOString()
      });

      return res.json({ sucesso: true, mensagem: "Presente marcado como ENTREGUE" });
    }

    return res.status(400).json({ sucesso: false, mensagem: "Ação inválida." });

  } catch (err) {
    console.error("🔥 ERRO LOGISTICA:", err);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno.", detalhe: err.message });
  }
}
