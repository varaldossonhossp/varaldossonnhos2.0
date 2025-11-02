// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final 2025-11-02)
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não suportado." });
  }

  try {
    // ============================================================
    // 🔑 Conexão Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // ============================================================
    // 📦 Dados recebidos do frontend
    // ============================================================
    const {
      nome_crianca_id,   // ID do registro da cartinha (ex: recXXXX)
      nome_usuario_id,   // ID do registro do usuário (ex: recXXXX)
      pontos_coleta_id,  // ID do ponto de coleta (opcional)
      data_evento_id,    // ID do evento (opcional)
    } = req.body || {};

    if (!nome_crianca_id || !nome_usuario_id) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes (nome_crianca_id ou nome_usuario_id).",
      });
    }

    // ============================================================
    // 1️⃣ Cria registro na tabela “adocoes”
    //    Usar NAMES dos campos (evita problemas de fldIDs e unknown field)
    // ============================================================
    const fieldsToCreate = {
      // nomes exatos dos campos na tabela 'adocoes'
      data_adocao: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      // envie a opção sem acento exatamente como configurado no Airtable
      status_adocao: "aguardando confirmacao",
      nome_crianca: [nome_crianca_id],
      nome_usuario: [nome_usuario_id],
    };

    if (data_evento_id) fieldsToCreate.data_evento = [data_evento_id];
    if (pontos_coleta_id) fieldsToCreate.pontos_coleta = [pontos_coleta_id];

    const created = await base("adocoes").create([{ fields: fieldsToCreate }]);
    const novoRegistro = created && created[0] ? created[0] : null;

    // ============================================================
    // 2️⃣ Atualiza cartinha → status “adotada”
    // ============================================================
    try {
      await base("cartinhas").update([
        {
          id: nome_crianca_id,
          fields: { status: "adotada" },
        },
      ]);
    } catch (errCart) {
      // não falhar toda a operação se update da cartinha falhar: log e segue
      console.warn("⚠️ Falha ao atualizar status da cartinha:", errCart?.message || errCart);
    }

    // ============================================================
    // 3️⃣ Envia e-mail ao administrador (EmailJS) — opcional
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
              assunto: "Nova adoção registrada 💙",
              mensagem: `Uma nova adoção foi registrada no Varal dos Sonhos.`,
              id_cartinha: nome_crianca_id,
              id_usuario: nome_usuario_id,
              ponto_coleta: pontos_coleta_id || "não informado"
            },
          }),
        });

        if (!emailResp.ok) {
          console.error("⚠️ Falha ao enviar e-mail:", await emailResp.text());
        } else {
          console.log("📨 E-mail de notificação enviado ao administrador.");
        }
      } else {
        console.log("EmailJS não configurado (variáveis de ambiente faltando).");
      }
    } catch (errEmail) {
      console.warn("⚠️ Erro ao enviar e-mail:", errEmail?.message || errEmail);
    }

    // ============================================================
    // ✅ Retorno final
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Adoção criada com sucesso!",
      record: novoRegistro
    });

  } catch (error) {
    console.error("❌ ERRO INTERNO /api/adocoes:", error);
    // se o erro vier do Airtable (ex: INVALID_MULTIPLE_CHOICE_OPTIONS), ele virá aqui
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar adoção.",
      error: error?.message || String(error)
    });
  }
}
