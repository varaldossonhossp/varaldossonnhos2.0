// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js
// ------------------------------------------------------------
// Fluxo da logística após a confirmação da adoção:
//
// 1) RECEBER PRESENTE  (acao="receber")
//    → muda status para "presente recebido"
//    → cria movimento no ponto
//    → envia e-mail ao ADMIN (EmailJS)
//
// 2) COLETAR PRESENTE  (acao="coletar")
//    → muda status para "presente entregue"
//    → cria movimento no ponto
//    → envia e-mail ao DOADOR (Mailjet)
//
// IMPORTANTE:
// Se o e-mail falhar → NÃO muda status e retorna erro.
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// ------------------------------------------------------------
// 🗂️ TABELAS UTILIZADAS
// ------------------------------------------------------------
const TB_ADOCOES = "adocoes";
const TB_MOV = "ponto_movimentos";
const TB_USUARIOS = "usuario";
const TB_CARTINHAS = "cartinha";
const TB_PONTOS = "pontos_coleta";


// ------------------------------------------------------------
// ▶ Email ADMIN — EmailJS (para RECEBIMENTO)
// ------------------------------------------------------------
async function enviarEmailAdmin_Recebimento(data) {
  try {
    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ADMIN_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        ponto_nome: data.ponto_nome,
        nome_crianca: data.nome_crianca,
        nome_doador: data.nome_doador,
        id_adocao: data.id_adocao
      }
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      console.error("❌ Falha no envio EmailJS:", await r.text());
      return false;
    }

    console.log("📨 Email enviado ao ADMIN (recebimento)");
    return true;

  } catch (err) {
    console.error("🔥 ERRO EMAIL ADMIN:", err);
    return false;
  }
}


// ------------------------------------------------------------
// ▶ Email DOADOR — Mailjet (para COLETA / ENTREGA FINAL)
// ------------------------------------------------------------
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
            { Email: data.email_doador, Name: data.nome_doador }
          ],
          TemplateID: parseInt(process.env.MAILJET_TEMPLATE_ID_RECEBIDO),
          TemplateLanguage: true,
          Subject: "🎁 Seu presente foi entregue à equipe! 💙",
          Variables: {
            donor_name: data.nome_doador,
            child_name: data.nome_crianca,
            child_gift: data.sonho,
            order_id: data.order_id,
            received_date: data.received_date,
            pickup_name: data.ponto_nome,
            pickup_address: data.ponto_endereco,
            pickup_phone: data.ponto_telefone
          }
        }
      ]
    };

    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`
          ).toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      console.error("❌ Falha no envio Mailjet:", await r.text());
      return false;
    }

    console.log("📨 Email enviado ao DOADOR (entrega final)");
    return true;

  } catch (err) {
    console.error("🔥 ERRO EMAIL DOADOR:", err);
    return false;
  }
}


// ------------------------------------------------------------
// 🌟 HANDLER PRINCIPAL
// ------------------------------------------------------------
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido. Use POST."
    });
  }

  // Dados enviados pelo painel
  const { acao, id_adocao, id_ponto, responsavel, observacoes } = req.body;

  if (!acao || !id_adocao || !id_ponto) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Campos obrigatórios ausentes."
    });
  }

  try {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID);

    // Buscar adoção completa
    const ado = await base(TB_ADOCOES).find(id_adocao);
    const f = ado.fields;

    // Buscar dados auxiliares
    const user = f.id_usuario ? await base(TB_USUARIOS).find(f.id_usuario[0]) : null;
    const cart = f.id_cartinha ? await base(TB_CARTINHAS).find(f.id_cartinha[0]) : null;
    const ponto = await base(TB_PONTOS).find(id_ponto);

    const nomeCrianca = cart?.fields?.nome_crianca || "";
    const sonho = cart?.fields?.sonho || "";
    const nomeDoador = user?.fields?.nome_usuario || "";
    const emailDoador = user?.fields?.email_usuario || "";

    const pontoNome = ponto?.fields?.nome_ponto || "";
    const pontoEndereco = ponto?.fields?.endereco || "";
    const pontoTelefone = ponto?.fields?.telefone || "";


    // ============================================================
    // 1) RECEBIMENTO DO PRESENTE
    // ============================================================
    if (acao === "receber") {

      // ENVIAR EMAIL ANTES DE ALTERAR STATUS
      const enviado = await enviarEmailAdmin_Recebimento({
        ponto_nome: pontoNome,
        nome_crianca: nomeCrianca,
        nome_doador: nomeDoador,
        id_adocao
      });

      if (!enviado) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao enviar e-mail. O status NÃO foi alterado."
        });
      }

      // Agora sim altera status
      await base(TB_ADOCOES).update([
        { id: id_adocao, fields: { status_adocao: "presente recebido" } }
      ]);

      // Registrar movimento
      await base(TB_MOV).create([
        {
          fields: {
            id_ponto: [id_ponto],
            id_adocao: [id_adocao],
            tipo_movimento: "recebimento",
            responsavel,
            observacoes,
            data: new Date().toISOString()
          }
        }
      ]);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Presente marcado como RECEBIDO."
      });
    }


    // ============================================================
    // 2) COLETA / ENTREGA FINAL
    // ============================================================
    if (acao === "coletar") {

      const enviado = await enviarEmailDoador_Entrega({
        email_doador: emailDoador,
        nome_doador: nomeDoador,
        nome_crianca: nomeCrianca,
        sonho,
        order_id: id_adocao,
        received_date: new Date().toLocaleDateString("pt-BR"),
        ponto_nome: pontoNome,
        ponto_endereco: pontoEndereco,
        ponto_telefone: pontoTelefone
      });

      if (!enviado) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao enviar e-mail ao doador. O status NÃO foi alterado."
        });
      }

      await base(TB_ADOCOES).update([
        { id: id_adocao, fields: { status_adocao: "presente entregue" } }
      ]);

      // Registrar movimento
      await base(TB_MOV).create([
        {
          fields: {
            id_ponto: [id_ponto],
            id_adocao: [id_adocao],
            tipo_movimento: "retirada",
            responsavel,
            observacoes,
            data: new Date().toISOString()
          }
        }
      ]);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Presente marcado como ENTREGUE."
      });
    }


    // ------------------------------------------------------------
    // Ação inválida
    // ------------------------------------------------------------
    return res.status(400).json({
      sucesso: false,
      mensagem: "Ação desconhecida."
    });

  } catch (err) {
    console.error("🔥 ERRO LOGISTICA:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao executar a ação.",
      detalhe: err.message
    });
  }
}
