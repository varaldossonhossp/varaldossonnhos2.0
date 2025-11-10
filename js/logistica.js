// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js
// ------------------------------------------------------------
// • Atualiza status_adocao → "presente recebido"
// • Envia e-mail via Mailjet para o doador (template 7473367)
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido." });
  }

  const {
    id_adocao,
    donor_email,
    donor_name,
    child_name,
    child_gift,
    order_id,
    pickup_name,
    pickup_address,
    pickup_phone
  } = req.body;

  try {
    // ============================================================
    // 1️⃣ Atualiza status da adoção no Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    await base("adocoes").update([
      { id: id_adocao, fields: { status_adocao: "presente recebido" } },
    ]);

    console.log(`✅ Status atualizado para "presente recebido" (${id_adocao})`);

    // ============================================================
    // 2️⃣ Envia e-mail de confirmação via Mailjet
    // ============================================================
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_SECRET_KEY;
    const templateId = process.env.MAILJET_TEMPLATE_ID_RECEBIDO;
    const fromEmail = process.env.MAILJET_FROM_EMAIL;
    const fromName = process.env.MAILJET_FROM_NAME;

    const received_date = new Date().toLocaleDateString("pt-BR");

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: fromEmail, Name: fromName },
            To: [{ Email: donor_email, Name: donor_name }],
            TemplateID: parseInt(templateId),
            TemplateLanguage: true,
            Subject: "🎁 Presente Recebido - Varal dos Sonhos 💙",
            Variables: {
              donor_name,
              child_name,
              child_gift,
              order_id,
              received_date,
              pickup_name,
              pickup_address,
              pickup_phone,
            },
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    console.log("✅ E-mail enviado via Mailjet:", data);

    return res.status(200).json({
      success: true,
      message: "Status atualizado e e-mail enviado com sucesso!",
      data,
    });
  } catch (error) {
    console.error("❌ Erro em /api/logistica:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar status ou enviar e-mail.",
      detail: error.message,
    });
  }
}
