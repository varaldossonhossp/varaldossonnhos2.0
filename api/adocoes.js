// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final 2025-11-02)
// ============================================================
// Funções:
//   ✅ Cria registro na tabela "adocoes" usando os fldIDs corretos do Airtable
//   ✅ Atualiza status da cartinha → "adotada"
//   ✅ Envia e-mail ao administrador via EmailJS
// ------------------------------------------------------------

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
    } = req.body;

    if (!nome_crianca_id || !nome_usuario_id) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes (nome_crianca_id ou nome_usuario_id).",
      });
    }

    // ============================================================
    // 📅 Campos mapeados com os IDs reais do Airtable
    // ============================================================
    const camposAdocoes = {
      fldYKA91fwe5Tjtzt: "data_adocao",
      fldFdV5OHkLkReHw3: "status_adocao",
      fldXC3LPDf2NJnX0O: "nome_crianca",
      fldhbnWIGiIVKS8na: "nome_usuario",
      fldt9IJ00c3HP7DB0: "data_evento",
      fldNw32NarsI4wTux: "pontos_coleta",
    };

    // ============================================================
    // 1️⃣ Cria registro na tabela “adocoes”
    // ============================================================
    const record = await base("adocoes").create([
      {
        fields: {
          [camposAdocoes.fldYKA91fwe5Tjtzt]: new Date().toISOString().split("T")[0], // data_adocao
          [camposAdocoes.fldFdV5OHkLkReHw3]: "aguardando confirmacao", // ⚠️ sem acento
          [camposAdocoes.fldXC3LPDf2NJnX0O]: [nome_crianca_id],
          [camposAdocoes.fldhbnWIGiIVKS8na]: [nome_usuario_id],
          [camposAdocoes.fldt9IJ00c3HP7DB0]: data_evento_id ? [data_evento_id] : undefined,
          [camposAdocoes.fldNw32NarsI4wTux]: pontos_coleta_id ? [pontos_coleta_id] : undefined,
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza cartinha → status “adotada”
    // ============================================================
    await base("cartinhas").update([
      {
        id: nome_crianca_id,
        fields: { status: "adotada" },
      },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail ao administrador (EmailJS)
    // ============================================================
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

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
          },
        }),
      });

      if (!emailResp.ok) {
        console.error("⚠️ Falha ao enviar e-mail:", await emailResp.text());
      } else {
        console.log("📨 E-mail de notificação enviado ao administrador.");
      }
    } catch (err) {
      console.error("⚠️ Erro ao enviar e-mail:", err.message);
    }

    // ============================================================
    // ✅ Retorno final
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Adoção criada com sucesso!",
      record: record[0],
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
