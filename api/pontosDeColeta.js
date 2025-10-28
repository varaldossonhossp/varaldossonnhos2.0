// ============================================================
// 💙 VARAL DOS SONHOS — /api/pontosdecoleta.js
// Retorna lista de pontos de coleta do Airtable
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const table = base(process.env.AIRTABLE_PONTOS_TABLE);

    const records = await table.select({}).all();

    const pontos = records.map(r => ({
      id: r.id,
      nome_ponto: r.get("nome_ponto"),
      endereco: r.get("endereco"),
      responsavel: r.get("responsavel"),
      telefone: r.get("telefone"),
      email_ponto: r.get("email_ponto"),
      horario_funcionamento: r.get("horario_funcionamento"),
    }));

    res.status(200).json({ sucesso: true, pontos });
  } catch (erro) {
    console.error("Erro API /pontosdecoleta:", erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
}
