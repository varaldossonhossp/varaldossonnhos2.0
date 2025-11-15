// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js (VERSÃO FINAL COMPLETA)
// ------------------------------------------------------------
// Fluxo do ponto de coleta:
//  • RECEBIMENTO  → status = "presente recebido"
//      - Cria ponto_movimentos
//      - Envia EmailJS → admin
//
//  • RETIRADA     → status = "presente entregue"
//      - Cria ponto_movimentos
//      - Envia MAILJET → doador
//
// Compatível com Node 20 / Vercel
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// ============================================================
// ⚙️ VARIÁVEIS DAS TABELAS
// ============================================================
const TB_ADOCOES = "adocoes";
const TB_MOV = "ponto_movimentos";
const TB_USUARIOS = "usuario";
const TB_CARTINHAS = "cartinha";

// ============================================================
// 🔧 Função para parsear body (Node 20)
// ============================================================
async function parseBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { resolve({}); }
    });
  });
}

// ============================================================
// 📩 Email ADMIN (EmailJS) — Recebimento
// ============================================================
async function enviarEmailAdmin_EmailJS(data) {
  try {
    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID_ADMIN,
      template_id: process.env.EMAILJS_TEMPLATE_ID_RECEBIMENTO,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        ponto_nome: data.ponto_nome,
        id_adocao: data.id_adocao,
        nome_crianca: data.nome_crianca,
        nome_doador: data.nome_doador
      }
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return r.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 📩 Email DOADOR (Mailjet) — Retirada / Presente entregue
// ============================================================
async function enviarEmailDoador_Mailjet(data) {
  try {
    const payload = {
      Messages: [
        {
          From: { 
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME
          },
          To: [{ Email: data.email_doador, Name: data.nome_doador }],
          TemplateID: parseInt(process.env.MAILJET_TEMPLATE_ID_ENTREGA),
          TemplateLanguage: true,
          Subject: "🎁 Seu presente foi entregue! 💙",
          Variables: {
            donor_name: data.nome_doador,
            child_name: data.nome_crianca,
            child_gift: data.sonho,
            evento: data.evento_nome,
          }
        }
      ]
    };

    const r = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    return r.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 🌟 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ sucesso: false, mensagem: "Método não permitido." });

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  const body = await parseBody(req);

  const { acao, id_adocao, id_ponto, responsavel, observacoes, foto } = body;

  if (!acao || !id_adocao || !id_ponto)
    return res.status(400).json({ sucesso: false, mensagem: "Campos obrigatórios ausentes." });

  try {
    // 1) Buscar adoção completa
    const ado = await base(TB_ADOCOES).find(id_adocao);
    const f = ado.fields;

    // 2) Buscar dados extras
    const idCartinha = f.id_cartinha ? f.id_cartinha[0] : null;
    const idUsuario = f.id_usuario ? f.id_usuario[0] : null;

    const cart = idCartinha ? await base(TB_CARTINHAS).find(idCartinha) : null;
    const user = idUsuario ? await base(TB_USUARIOS).find(idUsuario) : null;

    const nomeCrianca = cart?.get("nome_crianca") || "";
    const sonho = cart?.get("sonho") || "";
    const nomeDoador = user?.get("nome_usuario") || "";
    const emailDoador = user?.get("email_usuario") || "";

    // ============================================================
    // 📥 RECEBER PRESENTE
    // ============================================================
    if (acao === "receber") {

      await base(TB_ADOCOES).update([
        { id: id_adocao, fields: { status_adocao: "presente recebido" } }
      ]);

      await base(TB_MOV).create([
        {
          fields: {
            id_ponto: [id_ponto],
            id_adocao: [id_adocao],
            tipo_movimento: "recebimento",
            responsavel,
            observacoes,
            foto,
            data: new Date().toISOString()
          }
        }
      ]);

      await enviarEmailAdmin_EmailJS({
        id_adocao,
        ponto_nome: id_ponto,
        nome_crianca: nomeCrianca,
        nome_doador: nomeDoador
      });

      return res.status(200).json({ sucesso: true, mensagem: "Recebimento registrado." });
    }

    // ============================================================
    // 🚚 RETIRADA
    // ============================================================
    if (acao === "retirar") {

      await base(TB_ADOCOES).update([
        { id: id_adocao, fields: { status_adocao: "presente entregue" } }
      ]);

      await base(TB_MOV).create([
        {
          fields: {
            id_ponto: [id_ponto],
            id_adocao: [id_adocao],
            tipo_movimento: "retirada",
            responsavel,
            observacoes,
            foto,
            data: new Date().toISOString()
          }
        }
      ]);

      await enviarEmailDoador_Mailjet({
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: nomeCrianca,
        sonho,
        evento_nome: "Evento de entrega"
      });

      return res.status(200).json({ sucesso: true, mensagem: "Retirada registrada." });
    }

    return res.status(400).json({ sucesso: false, mensagem: "Ação desconhecida." });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}
