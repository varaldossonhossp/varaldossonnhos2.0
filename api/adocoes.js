// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão estável e mínima)
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
      id_cartinha, // recordId da cartinha (ex: recxxxx)
      id_usuario,  // recordId do usuário
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta, // objeto com nome, email, etc.
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
    // 1️⃣ Cria o registro de adoção na tabela "adocoes"
    // ============================================================
    const novaAdocao = await base("adocoes").create([
      {
        fields: {
          crianca: [id_cartinha],        // ✅ campo correto no Airtable
          nome_usuario: [id_usuario],    // ✅ link com tabela de usuários
          nome_doador,
          email_doador,
          telefone_doador,
          status_adocao: "aguardando confirmacao",
          data_adocao: new Date().toISOString().split("T")[0],
          ponto_coleta: ponto_coleta?.nome || "", // salva nome simples se quiser ver no Airtable
        },
      },
    ]);

    // ============================================================
    // 2️⃣ Atualiza status da cartinha para "adotada"
    // ============================================================
    await base("cartinhas").update([
      {
        id: id_cartinha,
        fields: { status: "adotada" },
      },
    ]);

    // ============================================================
    // ✅ Retorno de sucesso
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
