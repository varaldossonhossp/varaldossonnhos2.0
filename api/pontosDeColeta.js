// ============================================================
// 💙 VARAL DOS SONHOS — /api/pontosdecoleta.js
// ------------------------------------------------------------
// Retorna os pontos de coleta do Airtable.
// Tabela: pontos_coleta
// Campos: nome_ponto, endereco, responsavel, telefone, email_ponto, horario_funcionamento
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const tabela = base(process.env.AIRTABLE_PONTOS_TABLE);

    const registros = await tabela.select({}).all();

    const pontos = registros.map((r) => ({
      id: r.id,
      nome_ponto: r.get("nome_ponto") || "—",
      endereco: r.get("endereco") || "—",
      responsavel: r.get("responsavel") || "—",
      telefone: r.get("telefone") || "—",
      email_ponto: r.get("email_ponto") || "—",
      horario_funcionamento: r.get("horario_funcionamento") || "—",
      status: r.get("status") || "ativo",
    }));

    res.status(200).json({ sucesso: true, pontos });
  } catch (erro) {
    console.error("Erro na rota /api/pontosdecoleta:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar pontos de coleta.",
      erro: erro.message,
    });
  }
}
