// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final completa)
// ------------------------------------------------------------
// Compatível com o esquema real do Airtable (tabelas: adocoes, cartinhas, pontos_coleta)
// Inclui criação, atualização, e envio de e-mail ao admin
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  }

  try {
    // 🔑 Conexão com Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // 📦 Dados recebidos
    const {
      id_cartinha,
      id_usuario,
      ponto_coleta, // { id, nome }
    } = req.body || {};

    if (!id_cartinha || !id_usuario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios ausentes: id_cartinha e id_usuario.",
      });
    }

    // ============================================================
    // 1️⃣ Cria registro na tabela "adocoes"
    // ============================================================
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          data_adocao: new Date().toISOString().split("T")[0],
          status_adocao: "aguardando confirmação",
          nome_crianca: [id_cartinha],
          nome_usuario: [id_usuario],
          pontos_coleta: ponto_coleta?.id ? [ponto_coleta.id] : undefined,
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza status da cartinha
    // ============================================================
    await base("cartinhas").update([
      { id: id_cartinha, fields: { status: "adotada" } },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail de notificação (EmailJS)
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
            assunto: "Nova Adoção Realizada 💙",
            mensagem: `Uma nova adoção foi registrada.`,
            id_cartinha,
            id_usuario,
            ponto_coleta: ponto_coleta?.nome || "não informado",
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
      id_adocao: novaAdocao[0].id,
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
