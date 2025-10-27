// ============================================================
// 🏪 VARAL DOS SONHOS — /api/pontosdecoleta.js
// ------------------------------------------------------------
// Retorna os pontos de coleta ativos (tabela: pontos_coleta).
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ sucesso: false, mensagem: "Método inválido." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const table = process.env.AIRTABLE_PONTOCOLETA_TABLE || "pontos_coleta";

    const records = await base(table)
      .select({
        filterByFormula: "OR({status} = 'ativo', {status} = 'Ativo', {status} = TRUE())",
        sort: [{ field: "nome_ponto", direction: "asc" }],
        maxRecords: 100,
      })
      .all();

    const pontos = records.map((r) => ({
      id: r.id,
      id_ponto: r.fields.id_ponto || "",
      nome_ponto: r.fields.nome_ponto || "Ponto de Coleta",
      endereco: r.fields.endereco || "Endereço não informado",
      telefone: r.fields.telefone || "",
      email_ponto: r.fields.email_ponto || "",
      horario: r.fields.horario || "",
      responsavel: r.fields.responsavel || "",
      status: r.fields.status || "",
    }));

    res.status(200).json({ sucesso: true, pontos });
  } catch (e) {
    console.error("Erro /api/pontosdecoleta:", e);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao listar pontos de coleta." });
  }
}
