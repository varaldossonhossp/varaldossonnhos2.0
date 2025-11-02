// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão ajustada aos campos reais)
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não suportado.",
    });
  }

  try {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID);

    const {
      id_cartinha, // recordId da cartinha
      id_usuario, // recordId do usuário
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta, // { nome, endereco, telefone, email }
      nome_crianca,
      sonho,
    } = req.body;

    // ============================================================
    // 1️⃣ Cria registro na tabela "adocoes"
    // ============================================================
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          nome_crianca: [id_cartinha], // ✅ correto — link para tabela “cartinhas”
          nome_usuario: [id_usuario], // ✅ correto — link para tabela “usuarios”
          pontos_coleta: ponto_coleta?.id ? [ponto_coleta.id] : undefined, // opcional se tiver o recordId
          nome_doador,
          email_doador,
          telefone_doador,
          status_adocao: "aguardando confirmacao",
          data_adocao: new Date().toISOString().split("T")[0],
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza a cartinha → status = "adotada"
    // ============================================================
    await base("cartinhas").update([
      {
        id: id_cartinha,
        fields: { status: "adotada" },
      },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail para o ADMINISTRADOR via API REST EmailJS
    // ============================================================
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
          nome_doador,
          email_doador,
          nome_crianca,
          sonho,
          ponto_coleta: ponto_coleta?.nome || "não informado",
        },
      }),
    });

    if (!emailResp.ok) {
      console.error("⚠️ Falha ao enviar e-mail:", await emailResp.text());
    }

    // ============================================================
    // ✅ Retorno final
    // ============================================================
    return res.status(200).json({
      sucesso: true,
      mensagem: "Adoção registrada com sucesso e e-mail enviado ao administrador.",
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
