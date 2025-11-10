// ============================================================
// 💙 VARAL DOS SONHOS — /api/presenteRecebido.js
// ------------------------------------------------------------
// Envia e-mail ao doador informando que o presente foi recebido
// Integração com Mailjet API + Template 7473367
// ============================================================

import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido." });
  }

  try {
    const {
      donor_email,
      donor_name,
      child_name,
      child_gift,
      order_id,
      received_date,
      pickup_name,
      pickup_address,
      pickup_phone
    } = req.body;

    if (!donor_email) {
      return res.status(400).json({ success: false, message: "E-mail do doador é obrigatório." });
    }

    // ============================================================
    // 1️⃣ Configuração Mailjet
    // ============================================================
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_SECRET_KEY;
    const templateId = process.env.MAILJET_TEMPLATE_ID_RECEBIDO;
    const fromEmail = process.env.MAILJET_FROM_EMAIL;
    const fromName = process.env.MAILJET_FROM_NAME;

    // ============================================================
    // 2️⃣ Montagem da requisição
    // ============================================================
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
            From: {
              Email: fromEmail,
              Name: fromName,
            },
            To: [
              {
                Email: donor_email,
                Name: donor_name,
              },
            ],
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

    return res.status(200).json({ success: true, message: "E-mail enviado com sucesso!", data });
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    return res.status(500).json({ success: false, message: "Erro ao enviar e-mail.", detail: error.message });
  }
}
