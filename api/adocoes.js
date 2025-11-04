// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão estável revisada)
// ------------------------------------------------------------
// • Cria registro na tabela "adocoes"
// • Atualiza cartinha -> status "adotada"
// • Envia e-mail de notificação ao administrador (EmailJS)
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não suportado." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const { nome_crianca_id, nome_usuario_id, pontos_coleta_id, data_evento_id } = req.body || {};

    if (!nome_crianca_id || !nome_usuario_id) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes (nome_crianca_id ou nome_usuario_id).",
      });
    }

    // ============================================================
    // 1️⃣ Cria registro na tabela “adocoes”
    // ============================================================
    const fieldsToCreate = {
      data_adocao: new Date().toISOString().split("T")[0],
      status_adocao: "aguardando confirmacao",
      nome_crianca: [nome_crianca_id],
      nome_usuario: [nome_usuario_id],
    };

    if (data_evento_id) fieldsToCreate.data_evento = [data_evento_id];
    if (pontos_coleta_id) fieldsToCreate.pontos_coleta = [pontos_coleta_id];

    const novaAdocao = await base("adocoes").create([{ fields: fieldsToCreate }]);
    const idAdocao = novaAdocao[0].id;

    // ============================================================
    // 2️⃣ Atualiza status da cartinha
    // ============================================================
    try {
      await base("cartinha").update([
        { id: nome_crianca_id, fields: { status: "seld9JVzSUP4DShWu" } }, // ID da opção “adotada”
      ]);
      console.log(`✅ Cartinha ${nome_crianca_id} marcada como adotada.`);
    } catch (errCart) {
      console.warn("⚠️ Falha ao atualizar status da cartinha:", errCart);
    }

    // ============================================================
    // 3️⃣ Envia e-mail ao administrador (EmailJS)
    // ============================================================
    try {
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = "template_c7kwpbk"; // Admin Confirmation Request
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        const emailBody = {
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            donor_name: "Novo Doador",
            donor_email: "—",
            donor_phone: "—",
            child_name: "Cartinha ID " + nome_crianca_id,
            child_gift: "Ver no painel",
            pickup_name: "Ver no painel",
            pickup_address: "Ver no painel",
            pickup_phone: "Ver no painel",
            order_id: idAdocao,
          },
        };

        console.log("📦 Enviando payload EmailJS:", JSON.stringify(emailBody, null, 2));

        const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailBody),
        });

        const respText = await emailResp.text();
        console.log("📧 Resposta EmailJS:", emailResp.status, respText);

        if (!emailResp.ok) {
          console.error("⚠️ Falha ao enviar e-mail:", respText);
        } else {
          console.log("📨 E-mail enviado com sucesso ao administrador.");
        }
      } else {
        console.error("⚠️ Variáveis EmailJS ausentes no ambiente.");
      }
    } catch (errEmail) {
      console.warn("⚠️ Erro ao enviar e-mail:", errEmail.message);
    }

    return res.status(200).json({
      success: true,
      message: "Adoção criada com sucesso!",
      id_adocao: idAdocao,
    });
  } catch (error) {
    console.error("❌ ERRO INTERNO /api/adocoes:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar adoção.",
      error: error.message,
    });
  }
}
