// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão ID-based Airtable)
// ------------------------------------------------------------
// ✅ Compatível com a estrutura de campos da tabela "ADOÇÕES"
// ✅ Usa IDs fldXXXX em vez de nomes de campo
// ✅ Atualiza cartinha e envia e-mail
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  }

  try {
    // 🔑 Conexão Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // 📦 Dados recebidos do frontend
    const {
      nome_crianca_id,    // ID da cartinha (recXXXX)
      nome_usuario_id,    // ID do usuário (recXXXX)
      pontos_coleta_id,   // ID do ponto de coleta (recXXXX)
      data_evento_id,     // ID do evento (opcional)
      gamificacao_id,     // ID da regra (opcional)
    } = req.body || {};

    if (!nome_crianca_id || !nome_usuario_id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios ausentes (nome_crianca_id e nome_usuario_id).",
      });
    }

    // ============================================================
    // 1️⃣ Criação de Adoção (usando IDs de campo)
    // ============================================================
    const record = await base("adocoes").create([
      {
        fields: {
          "fldYKA91fwe5Tjtzt": new Date().toISOString().split("T")[0], // data_adocao
          "fldFdV5OHkLkReHw3": "aguardando confirmacao",              // status_adocao (sem acento!)
          "fldXC3LPDf2NJnX0O": [nome_crianca_id],                     // nome_crianca
          "fldhbnWIGiIVKS8na": [nome_usuario_id],                     // nome_usuario
          "fldt9IJ00c3HP7DB0": data_evento_id ? [data_evento_id] : undefined,
          "fldNw32NarsI4wTux": pontos_coleta_id ? [pontos_coleta_id] : undefined,
          "fldCKo2rLPvMEauwL": gamificacao_id ? [gamificacao_id] : undefined,
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza status da cartinha
    // ============================================================
    await base("cartinhas").update([
      { id: nome_crianca_id, fields: { status: "adotada" } },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail ao administrador (EmailJS)
    // ============================================================
    try {
      const resp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN,
          user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
          template_params: {
            assunto: "💙 Nova adoção registrada!",
            mensagem: `Uma nova adoção foi criada no sistema.`,
            nome_usuario_id,
            nome_crianca_id,
            pontos_coleta_id: pontos_coleta_id || "não informado",
          },
        }),
      });

      if (!resp.ok) console.warn("⚠️ Falha ao enviar e-mail:", await resp.text());
    } catch (erroEmail) {
      console.warn("⚠️ Erro ao enviar e-mail:", erroEmail.message);
    }

    // ============================================================
    // ✅ Retorno final
    // ============================================================
    return res.status(200).json({
      sucesso: true,
      mensagem: "Adoção registrada com sucesso!",
      id_adocao: record[0].id,
    });
  } catch (erro) {
    console.error("❌ ERRO INTERNO /api/adocoes:", erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar adoção.",
      erro: erro.message,
    });
  }
}
