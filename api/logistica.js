// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js (VERSÃO AJUSTADA CAMPOS REAIS)
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
// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js (VERSÃO FINAL 2025)
// ------------------------------------------------------------
// Compatível com as tabelas reais enviadas por Carina Mendes
// adocoes → usuario, cartinha, pontos_coleta, id_doacao, status_adocao
// pontos_movimentos → id_ponto, id_adocao, tipo_movimento, data...
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// ========================== CONSTANTES ========================
const TB_ADOCOES = "adocoes";
const TB_USUARIOS = "usuario";
const TB_CARTINHAS = "cartinha";
const TB_PONTOS = "pontos_coleta";
const TB_MOV = "ponto_movimentos";

// ============================================================
// ▶ Email ADMIN — EmailJS
// ============================================================

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
        id_doacao: data.id_doacao
      }
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return r.ok;

  } catch (err) {
    console.error("🔥 ERRO EMAIL ADMIN:", err);
    return false;
  }
}


// ============================================================
// ▶ Email DOADOR — Mailjet
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
            { Email: data.email_doador, Name: data.nome_doador }
          ],
          TemplateID: Number(process.env.MAILJET_TEMPLATE_ID_RECEBIDO),
          TemplateLanguage: true,
          Subject: "🎁 Seu presente foi entregue à equipe!",
          Variables: {
            donor_name: data.nome_doador,
            child_name: data.nome_crianca,
            child_gift: data.sonho,
            order_id: data.id_doacao,
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
          ).toString("base64")
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

  // Apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Use POST." });
  }

  const { acao, id_registro, responsavel, observacoes } = req.body;

  if (!acao || !id_registro) {
    return res.status(400).json({ sucesso: false, mensagem: "Campos ausentes." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // ================= Buscar adoção =================
    const ado = await base(TB_ADOCOES).find(id_registro);
    const f = ado.fields;

    const id_doacao = f.id_doacao;                      // autonumber
    const usuarioId = f.usuario?.[0];                   // linked record
    const cartinhaId = f.cartinha?.[0];                 // linked record
    const pontoId = f.pontos_coleta?.[0];               // linked record (correto)

    const user = await base(TB_USUARIOS).find(usuarioId);
    const cart = await base(TB_CARTINHAS).find(cartinhaId);
    const ponto = await base(TB_PONTOS).find(pontoId);

    // Campos derivados
    const nomeCrianca = cart?.fields?.nome_crianca || "";
    const sonho = cart?.fields?.sonho || "";
    const nomeDoador = user?.fields?.nome_usuario || "";
    const emailDoador = user?.fields?.email_usuario || "";

    const pontoNome = ponto?.fields?.nome_ponto || "";
    const pontoEndereco = ponto?.fields?.endereco || "";
    const pontoTelefone = ponto?.fields?.telefone || "";

    // ============================================================
    // 1️⃣ RECEBER PRESENTE
    // ============================================================
    if (acao === "receber") {

      const enviado = await enviarEmailAdmin_Recebimento({
        ponto_nome: pontoNome,
        nome_crianca: nomeCrianca,
        nome_doador: nomeDoador,
        id_doacao
      });

      if (!enviado) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao enviar e-mail ao ADMIN. Status não alterado."
        });
      }

      await base(TB_ADOCOES).update(id_registro, {
        status_adocao: "presente recebido"
      });

      await base(TB_MOV).create({
        id_ponto: [pontoId],
        id_adocao: [id_registro],
        tipo_movimento: "recebimento",
        responsavel,
        observacoes,
        data: new Date().toISOString()
      });

      return res.json({ sucesso: true, mensagem: "Presente marcado como RECEBIDO" });
    }


    // ============================================================
    // 2️⃣ COLETAR PRESENTE
    // ============================================================
    if (acao === "coletar") {

      const enviado = await enviarEmailDoador_Entrega({
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: nomeCrianca,
        sonho,
        id_doacao,
        received_date: new Date().toLocaleDateString("pt-BR"),
        ponto_nome: pontoNome,
        ponto_endereco: pontoEndereco,
        ponto_telefone: pontoTelefone
      });

      if (!enviado) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao enviar e-mail ao DOADOR. Status não alterado."
        });
      }

      await base(TB_ADOCOES).update(id_registro, {
        status_adocao: "presente entregue"
      });

      await base(TB_MOV).create({
        id_ponto: [pontoId],
        id_adocao: [id_registro],
        tipo_movimento: "retirada",
        responsavel,
        observacoes,
        data: new Date().toISOString()
      });

      return res.json({ sucesso: true, mensagem: "Presente marcado como ENTREGUE" });
    }

    // Ação inválida
    return res.status(400).json({ sucesso: false, mensagem: "Ação inválida" });

  } catch (err) {
    console.error("🔥 ERRO LOGISTICA:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno.",
      detalhe: err.message
    });
  }
}
