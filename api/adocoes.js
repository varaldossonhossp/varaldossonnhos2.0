// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (final compatível com campo "crianca")
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
      id_cartinha, // recordId do Airtable (ex: recA4B7xy1zTzKpZL)
      id_usuario, // recordId do doador
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta, // objeto { nome, endereco, telefone, email }
      nome_crianca,
      sonho,
    } = req.body;

    if (!id_cartinha || !id_usuario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios ausentes (id_cartinha ou id_usuario).",
      });
    }

    // ============================================================
    // 1️⃣ Cria o registro de adoção
    // ============================================================
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          crianca: [id_cartinha], // ✅ campo correto de link com tabela “cartinhas”
          nome_usuario: [id_usuario], // ✅ link com a tabela “usuarios”
          pontos_coleta: ponto_coleta?.id ? [ponto_coleta.id] : undefined,
          nome_doador,
          email_doador,
          telefone_doador,
          status_adocao: "aguardando confirmacao",
          data_adocao: new Date().toISOString().split("T")[0],
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza a cartinha → status "adotada"
    // ============================================================
    await base("cartinhas").update([
      {
        id: id_cartinha,
        fields: { status: "adotada" },
      },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail via EmailJS (opcional)
    // ============================================================
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await fetch("https://api.emailjs.com/api/v1.0/email/send", {
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
      }
    } catch (emailErro) {
      console.warn("⚠️ Falha ao enviar e-mail:", emailErro);
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
