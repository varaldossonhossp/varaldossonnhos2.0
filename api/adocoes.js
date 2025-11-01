// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final — compatível com Airtable)
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

const ok  = (res, data)          => res.status(200).json(data);
const err = (res, code, message) => res.status(code).json({ sucesso: false, mensagem: message });

// ============================================================
// 💌 Função auxiliar — Enviar e-mail ao ADMIN via EmailJS
// ============================================================
async function enviarEmailAdmin(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_ADMIN,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      email: process.env.EMAIL_ADMIN,
      donor_name: params.nome_doador || "",
      donor_email: params.email_doador || "",
      donor_phone: params.telefone_doador || "",
      child_name: params.nome_crianca || "",
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      order_id: params.id_doacao || "",
      confirm_url: `${process.env.APP_BASE_URL || ""}/api/confirmar?id_doacao=${encodeURIComponent(params.id_doacao || "")}`,
    },
  };

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("📧 E-mail enviado ao ADMIN.");
  } catch (e) {
    console.warn("⚠️ Falha no envio de e-mail ao ADMIN:", e.message);
  }
}

// ============================================================
// 🧩 Handler principal da API
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return err(res, 405, "Método não suportado.");

  try {
    console.log("🟢 POST /api/adocoes recebido.");
    console.log("📦 Body:", req.body);

    // Conexão Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES  = "adocoes";
    const T_CARTINHA = "cartinha";

    // Campos recebidos do front
    const {
      id_cartinha,
      id_usuario,
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta,
      nome_crianca,
      sonho,
    } = req.body || {};

    // ------------------------------------------------------------
    // Validação
    // ------------------------------------------------------------
    if (!id_usuario || (!id_cartinha && !nome_crianca)) {
      console.error("❌ Dados obrigatórios ausentes:", req.body);
      return err(res, 400, "Faltam dados obrigatórios para criar adoção.");
    }

    // ------------------------------------------------------------
    // Busca o recordId real da cartinha
    // ------------------------------------------------------------
    const idNum = parseInt(id_cartinha);
    const filtro = id_cartinha && !isNaN(idNum)
      ? `OR({id_cartinha}=${idNum}, {id_cartinha}='${id_cartinha}')`
      : `{nome_crianca}='${nome_crianca}'`;

    console.log("🔍 Filtro usado no Airtable:", filtro);

    const encontrados = await base(T_CARTINHA)
      .select({ filterByFormula: filtro, maxRecords: 1 })
      .firstPage();

    if (!encontrados.length) {
      console.error("⚠️ Cartinha não encontrada:", filtro);
      return err(res, 404, "Cartinha não encontrada no Airtable.");
    }

    const recordIdCartinha = encontrados[0].id;
    console.log("📄 recordId da cartinha:", recordIdCartinha);

    // ------------------------------------------------------------
    // Cria a nova adoção (não grava id_doacao manualmente)
    // ------------------------------------------------------------
    const novo = {
      data_adocao: new Date(), // Airtable entende nativamente o formato Date
      cartinha: [recordIdCartinha], // link
      nome_doador: nome_doador || "",
      email_doador: email_doador || "",
      telefone_doador: telefone_doador || "",
      ponto_coleta:
        typeof ponto_coleta === "string"
          ? ponto_coleta
          : ponto_coleta?.nome || "",
      nome_crianca: nome_crianca || "",
      sonho: sonho || "",
      status_adocao: "aguardando confirmacao",
    };

    // Vincula usuário, se existir campo "usuario" na tabela adocoes
    if (id_usuario) novo.usuario = [id_usuario];

    console.log("🧾 Dados prontos para registro:", novo);

    const recs = await base(T_ADOCOES).create([{ fields: novo }]);
    const id_doacao = recs[0].id;
    console.log("✅ Nova adoção criada:", id_doacao);

    // ------------------------------------------------------------
    // Atualiza a cartinha para "adotada"
    // ------------------------------------------------------------
    await base(T_CARTINHA).update([
      { id: recordIdCartinha, fields: { status: "adotada" } },
    ]);
    console.log("🎀 Cartinha marcada como adotada.");

    // ------------------------------------------------------------
    // Envia e-mail ao admin
    // ------------------------------------------------------------
    await enviarEmailAdmin({
      id_doacao,
      nome_doador,
      email_doador,
      telefone_doador,
      nome_crianca,
      sonho,
      ponto_coleta,
    });

    return ok(res, { sucesso: true, id_doacao });
  } catch (e) {
    console.error("🔥 ERRO INTERNO /api/adocoes:", e.message);
    console.error("📚 Stack:", e.stack);
    return err(res, 500, "Erro interno ao criar adoção.");
  }
}
