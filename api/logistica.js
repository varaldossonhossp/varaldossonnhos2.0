// ============================================================
// 💙 VARAL DOS SONHOS — /api/logistica.js
// ------------------------------------------------------------
// • Endpoint responsável pela LOGÍSTICA dos pontos de coleta.
// • Atualiza o status da adoção (tabela “adocoes”) para
//   “presente recebido”.
// • Dispara um e-mail automático ao doador confirmando que
//   o presente chegou ao ponto de coleta.
// • Integrações: Airtable (banco de dados) + Mailjet (SMTP/API).
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// ============================================================
// 🌐 FUNÇÃO PRINCIPAL (Handler padrão Next.js / Vercel)
// ============================================================
export default async function handler(req, res) {

  // -------------------------------
  // 1️⃣ Verifica o método HTTP
  // -------------------------------
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método não permitido. Utilize POST."
    });
  }

  // -------------------------------
  // 2️⃣ Extrai os dados recebidos do frontend (body da requisição)
  // -------------------------------
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

  if (!id_adocao || !donor_email) {
    return res.status(400).json({
      success: false,
      message: "Campos obrigatórios ausentes: id_adocao e donor_email."
    });
  }

  try {
    // ============================================================
    // 🔹 3️⃣ Conexão com o Airtable
    // ------------------------------------------------------------
    // O Airtable é usado como banco de dados “no-code” do projeto.
    // Aqui fazemos a autenticação usando as variáveis de ambiente.
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // ------------------------------------------------------------
    // Atualiza o campo “status_adocao” da tabela “adocoes”
    // para o valor literal “presente recebido”.
    // ------------------------------------------------------------
    await base("adocoes").update([
      { id: id_adocao, fields: { status_adocao: "presente recebido" } },
    ]);

    console.log(`✅ Adoção ${id_adocao} atualizada para “presente recebido”.`);

    // ============================================================
    // 🔹 4️⃣ Envio de e-mail via API do Mailjet
    // ------------------------------------------------------------
    // O Mailjet é um serviço SMTP/API que permite disparar
    // e-mails transacionais e personalizáveis com templates.
    // Aqui utilizamos o template 7473367 (Presente Recebido).
    // ============================================================

    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_SECRET_KEY;
    const templateId = process.env.MAILJET_TEMPLATE_ID_RECEBIDO;
    const fromEmail = process.env.MAILJET_FROM_EMAIL;
    const fromName = process.env.MAILJET_FROM_NAME;

    const received_date = new Date().toLocaleDateString("pt-BR");

    // Corpo da requisição HTTP para o endpoint do Mailjet
    const mailjetPayload = {
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
    };

    // ------------------------------------------------------------
    // Dispara a requisição usando o método POST autenticado
    // ------------------------------------------------------------
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
      },
      body: JSON.stringify(mailjetPayload),
    });

    const data = await response.json();

    // ------------------------------------------------------------
    // Caso o Mailjet retorne erro, ele é tratado aqui
    // ------------------------------------------------------------
    if (!response.ok) {
      console.error("❌ Erro no envio via Mailjet:", data);
      throw new Error("Falha no envio de e-mail pelo Mailjet.");
    }

    console.log("✅ E-mail enviado via Mailjet:", data);

    // ============================================================
    // 🔹 5️⃣ Retorno final de sucesso (para o frontend)
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Status atualizado e e-mail de confirmação enviado com sucesso.",
      details: data
    });

  } catch (error) {
    // ============================================================
    // ❌ 6️⃣ Tratamento de erros gerais
    // ============================================================
    console.error("❌ Erro interno /api/logistica:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar o status ou enviar e-mail.",
      details: error.message
    });
  }
}
