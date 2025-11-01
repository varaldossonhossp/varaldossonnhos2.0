// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (Versão Final Corrigida)
// ------------------------------------------------------------
// Corrige os erros 422 (campo data_adocao) e filtro NaN,
// com logs descritivos e integração segura com Airtable.
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// Funções utilitárias
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
      order_id: params.id_adocao || "",
      confirm_url: `${process.env.APP_BASE_URL || ""}/api/confirmar?id_adocao=${encodeURIComponent(params.id_adocao || "")}`,
    },
  };

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("📧 E-mail enviado ao ADMIN com sucesso.");
  } catch (e) {
    console.warn("⚠️ Falha ao enviar e-mail:", e.message);
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
    // 🔍 Validação de dados obrigatórios
    // ------------------------------------------------------------
    if (!id_usuario || (!id_cartinha && !nome_crianca)) {
      console.error("❌ Faltam dados obrigatórios:", req.body);
      return err(res, 400, "Faltam dados obrigatórios para criar a adoção.");
    }

    // ------------------------------------------------------------
    // 🔍 Busca cartinha no Airtable
    // ------------------------------------------------------------
    const idNum = parseInt(id_cartinha);
    const filtro = id_cartinha && !isNaN(idNum)
      ? `OR({id_cartinha}=${idNum}, {id_cartinha}='${id_cartinha}')`
      : `{nome_crianca}='${nome_crianca}'`;

    console.log("🔍 Filtro usado no Airtable:", filtro);

    let recordId = null;
    const encontrados = await base(T_CARTINHA)
      .select({ filterByFormula: filtro, maxRecords: 1 })
      .firstPage();

    if (encontrados.length > 0) {
      recordId = encontrados[0].id;
      console.log("📄 Cartinha encontrada:", recordId);
    } else {
      console.warn("⚠️ Nenhuma cartinha encontrada com filtro:", filtro);
    }

    // ------------------------------------------------------------
    // 📝 Criação do registro de adoção
    // ------------------------------------------------------------
    const novo = {
      data_adocao: new Date().toISOString().split("T")[0], // ✅ formato aceito pelo Airtable
      id_cartinha: id_cartinha || "",
      id_usuario: id_usuario,
      nome_doador: nome_doador || "",
      email_doador: email_doador || "",
      telefone_doador: telefone_doador || "",
      ponto_coleta: typeof ponto_coleta === "string" ? ponto_coleta : (ponto_coleta?.nome || ""),
      nome_crianca: nome_crianca || "",
      sonho: sonho || "",
      status_adocao: "aguardando confirmacao",
    };

    console.log("🧾 Dados prontos para criar registro:", novo);

    const recs = await base(T_ADOCOES).create([{ fields: novo }]);
    const id_adocao = recs[0].id;
    console.log("✅ Registro criado com sucesso:", id_adocao);

    // ------------------------------------------------------------
    // 🎀 Atualiza status da cartinha para "adotada"
    // ------------------------------------------------------------
    if (recordId) {
      await base(T_CARTINHA).update([{ id: recordId, fields: { status: "adotada" } }]);
      console.log("🎀 Cartinha marcada como adotada:", recordId);
    }

    // ------------------------------------------------------------
    // 💌 Envia e-mail ao admin
    // ------------------------------------------------------------
    await enviarEmailAdmin({
      id_adocao,
      nome_doador,
      email_doador,
      telefone_doador,
      nome_crianca,
      sonho,
      ponto_coleta,
    });

    return ok(res, { sucesso: true, id_adocao });
  } catch (e) {
    console.error("🔥 ERRO INTERNO DETECTADO /api/adocoes");
    console.error("Mensagem:", e.message);
    console.error("Stack:", e.stack);
    return err(res, 500, "Erro interno ao criar adoção.");
  }
}
