// ============================================================
// 🎁 VARAL DOS SONHOS — /api/adocoes.js
// ------------------------------------------------------------
// Endpoint responsável por:
//   ✅ Criar registro de adoção na tabela "adocoes"
//   ✅ Atualizar o status da cartinha para "Aguardando Confirmação"
//   ✅ Enviar e-mail ao doador usando EmailJS
// ============================================================

import Airtable from "airtable";
import enviarEmail from "../lib/enviarEmail.js"; // função auxiliar modularizada

// ============================================================
// 🔐 Conexão com Airtable
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// ============================================================
// ⚙️ Função principal /api/adocoes (método POST)
// ============================================================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não permitido." });
  }

  try {
    // Lê os dados enviados do front-end (JSON)
    const { id_cartinha, nome_doador, email_doador } = req.body;

    if (!id_cartinha || !nome_doador || !email_doador) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios ausentes.",
      });
    }

    // ============================================================
    // 🧾 1️⃣ Cria o registro de adoção
    // ------------------------------------------------------------
    // Cria novo registro na tabela "adocoes"
    // ============================================================
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          id_cartinha,
          nome_doador,
          email_doador,
          status: "Aguardando Confirmação",
          data_adocao: new Date().toISOString(),
        },
      },
    ]);

    // ============================================================
    // 🧩 2️⃣ Atualiza o status da cartinha
    // ------------------------------------------------------------
    // Muda de "Disponível" para "Aguardando Confirmação"
    // ============================================================
    await base("cartinhas").update([
      {
        id: id_cartinha,
        fields: { status: "Aguardando Confirmação" },
      },
    ]);

    // ============================================================
    // 💌 3️⃣ Envia e-mail de notificação (via EmailJS)
    // ============================================================
    await enviarEmail({
      to_email: email_doador,
      to_name: nome_doador,
      subject: "💙 Adoção recebida!",
      message: `
        Olá ${nome_doador},<br><br>
        Obrigado por adotar uma cartinha no <strong>Varal dos Sonhos</strong>! 🎁<br>
        Sua adoção foi registrada e aguarda confirmação da equipe.<br>
        Assim que confirmada, você receberá as instruções de entrega do presente.<br><br>
        Com carinho,<br>
        💙 Fantástica Fábrica de Sonhos
      `,
    });

    // ============================================================
    // ✅ 4️⃣ Retorno de sucesso
    // ============================================================
    res.status(201).json({
      sucesso: true,
      mensagem: "Adoção registrada com sucesso!",
      adocao: novaAdocao,
    });
  } catch (erro) {
    console.error("Erro ao registrar adoção:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao registrar adoção.",
      detalhe: erro.message,
    });
  }
}
