// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final 2025-11-02)
// ------------------------------------------------------------
// • Cria registro na tabela "adocoes"
// • Atualiza cartinha -> status "adotada"
// • Envia e-mail de notificação ao administrador via EmailJS
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método não suportado.",
    });
  }

  try {
    // ============================================================
    // 🔑 Conexão Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const {
      nome_crianca_id,
      nome_usuario_id,
      pontos_coleta_id,
      data_evento_id,
    } = req.body || {};

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
      status_adocao: "aguardando confirmacao", // sem acento!
      nome_crianca: [nome_crianca_id],
      nome_usuario: [nome_usuario_id],
    };

    if (data_evento_id) fieldsToCreate.data_evento = [data_evento_id];
    if (pontos_coleta_id) fieldsToCreate.pontos_coleta = [pontos_coleta_id];

    const novaAdocao = await base("adocoes").create([{ fields: fieldsToCreate }]);

    // ============================================================
    // 2️⃣ Atualiza status da cartinha
    // ============================================================
    try {
      await base("cartinhas").update([
        { id: nome_crianca_id, fields: { status: "adotada" } },
      ]);
    } catch (errCart) {
      console.warn("⚠️ Falha ao atualizar status da cartinha:", errCart);
    }

    // ============================================================
    // 3️⃣ Envia e-mail ao administrador (EmailJS)
    // ============================================================
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              assunto: "💙 Nova adoção registrada",
              mensagem: "Uma nova adoção foi registrada no Varal dos Sonhos.",
              id_cartinha: nome_crianca_id,
              id_usuario: nome_usuario_id,
              ponto_coleta: pontos_coleta_id || "não informado",
            },
          }),
        });

        if (!emailResp.ok) {
          console.error("⚠️ Falha ao enviar e-mail:", await emailResp.text());
        } else {
          console.log("📨 E-mail enviado com sucesso ao administrador.");
        }
      }
    } catch (errEmail) {
      console.warn("⚠️ Erro ao enviar e-mail:", errEmail.message);
    }

    // ============================================================
    // ✅ Retorno final
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Adoção criada com sucesso!",
      id_adocao: novaAdocao[0].id,
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
