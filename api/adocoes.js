// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão revisada)
// ------------------------------------------------------------
// Fluxo:
//  1️⃣ Recebe POST do carrinho
//  2️⃣ Cria registro na tabela "adocoes"
//  3️⃣ Atualiza status da cartinha para "adotada"
//  4️⃣ Envia e-mail ao administrador (aguardando confirmação)
// ============================================================

import Airtable from "airtable";
import emailjs from "@emailjs/browser";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
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
          ponto_coleta,
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
      { id: id_cartinha, fields: { status: "adotada" } },
    ]);

    // ============================================================
    // 3️⃣ Envia e-mail ao administrador
    // ============================================================
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    await emailjs.send(
      serviceId,
      templateId,
      {
        nome_doador,
        email_doador,
        nome_crianca,
        sonho,
        ponto_coleta,
      },
      publicKey
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Adoção registrada e notificação enviada ao administrador.",
      id_adocao: novaAdocao[0].id,
    });
  } catch (erro) {
    console.error("❌ Erro ao criar adoção:", erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar adoção.",
      erro: erro.message,
    });
  }
}
