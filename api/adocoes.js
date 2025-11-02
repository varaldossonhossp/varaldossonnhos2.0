// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final para Vercel)
// ------------------------------------------------------------
//  1️⃣ Cria o registro na tabela "adocoes"
//  2️⃣ Atualiza a cartinha para status "adotada"
//  3️⃣ Envia e-mail ao administrador via EmailJS REST API
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
      id_cartinha,
      id_usuario,
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta,
      nome_crianca,
      sonho,
    } = req.body;

    // ============================================================
    // 1️⃣ Cria registro na tabela "adocoes"
    // ============================================================
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          id_cartinha: id_cartinha,
          usuario: [id_usuario],
          nome_doador,
          email_doador,
          telefone_doador,
          ponto_coleta:
            typeof ponto_coleta === "object" ? ponto_coleta.nome : ponto_coleta,
          nome_crianca,
          sonho,
          status_adocao: "aguardando confirmacao",
          data_adocao: new Date().toISOString().split("T")[0],
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza cartinha → status = "adotada"
    // ============================================================
    await base("cartinhas").update([
      {
        id: id_cartinha,
        fields: { status: "adotada" },
      },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail ao ADMINISTRADOR (via REST EmailJS)
    // ============================================================
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        nome_doador,
        email_doador,
        nome_crianca,
        sonho,
        ponto_coleta:
          typeof ponto_coleta === "object" ? ponto_coleta.nome : ponto_coleta,
      },
    };

    const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
    });

    if (!emailResp.ok) {
      const errText = await emailResp.text();
      console.error("⚠️ Falha ao enviar e-mail:", errText);
    }

    // ============================================================
    // ✅ Retorna sucesso ao front
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
