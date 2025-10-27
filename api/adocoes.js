// ============================================================
// 💌 VARAL DOS SONHOS — /api/adocoes.js
// ------------------------------------------------------------
// Cria registro de adoção, envia e-mail e marca cartinha como "adotada".
// Tabelas Airtable: adocoes, cartinhas, usuarios, eventos, ponto_coleta
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// utilitário
const ok = (res, data) => res.status(200).json(data);
const err = (res, code, msg) => res.status(code).json({ sucesso: false, mensagem: msg });

async function enviarEmailJS({ nome_doador, email_doador, nome_crianca, sonho, ponto_coleta }) {
  try {
    const params = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_name: nome_doador,
        to_email: email_doador,
        subject: "Confirmação de Adoção 💙 Varal dos Sonhos",
        message: `Olá ${nome_doador}, sua adoção da cartinha de ${nome_crianca} (“${sonho}”) foi registrada!\n\nPonto de entrega: ${ponto_coleta}.\n\nObrigado por espalhar sonhos! 🌟`,
      },
    };

    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.warn("Falha ao enviar e-mail:", e.message);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
  const T_ADOCOES = "adocoes";
  const T_CARTINHAS = "cartinhas";

  try {
    if (req.method === "POST") {
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

      if (!id_cartinha || !id_usuario)
        return err(res, 400, "Faltam dados obrigatórios (id_cartinha ou id_usuario).");

      const nova = {
        data_adocao: new Date().toISOString(),
        id_cartinha,
        id_usuario,
        nome_doador,
        email_doador,
        telefone_doador,
        ponto_coleta,
        nome_crianca,
        sonho,
        status_adocao: "aguardando confirmacao",
      };

      const rec = await base(T_ADOCOES).create([{ fields: nova }]);

      // atualiza cartinha
      await base(T_CARTINHAS).update([
        { id: id_cartinha, fields: { status: "adotada" } },
      ]);

      // envia email (não bloqueia o fluxo)
      enviarEmailJS({ nome_doador, email_doador, nome_crianca, sonho, ponto_coleta });

      return ok(res, { sucesso: true, id: rec[0].id });
    }

    if (req.method === "GET") {
      const registros = await base(T_ADOCOES).select().all();
      return ok(res, { sucesso: true, adocoes: registros.map((r) => ({ id: r.id, ...r.fields })) });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("Erro /api/adocoes:", e);
    return err(res, 500, e.message || "Erro interno.");
  }
}
