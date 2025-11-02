// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (estável com e-mail + fallback seguro)
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

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

    if (!id_cartinha || !id_usuario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios ausentes (id_cartinha ou id_usuario).",
      });
    }

    // 1️⃣ Cria registro no Airtable
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          nome_crianca: [id_cartinha],
          nome_usuario: [id_usuario],
          pontos_coleta: ponto_coleta?.id ? [ponto_coleta.id] : undefined,
          nome_doador: nome_doador || "",
          email_doador: email_doador || "",
          telefone_doador: telefone_doador || "",
          status_adocao: "aguardando confirmacao",
          data_adocao: new Date().toISOString().split("T")[0],
        },
      },
    ]);

    // 2️⃣ Atualiza a cartinha
    await base("cartinhas").update([
      { id: id_cartinha, fields: { status: "adotada" } },
    ]);

    // 3️⃣ Envia e-mail (sem quebrar se falhar)
    try {
      const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN,
          user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
          template_params: {
            nome_doador,
            email_doador,
            telefone_doador,
            nome_crianca,
            sonho,
            ponto_coleta: ponto_coleta?.nome || "não informado",
          },
        }),
      });
      if (!emailResp.ok) {
        console.warn("⚠️ Falha no envio de e-mail:", await emailResp.text());
      }
    } catch (err) {
      console.warn("⚠️ Erro ao tentar enviar e-mail:", err.message);
    }

    // 4️⃣ Retorno final
    return res.status(200).json({
      sucesso: true,
      mensagem: "Adoção registrada e notificação enviada ao administrador.",
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
