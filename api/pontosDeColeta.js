// ============================================================
// 🏪 VARAL DOS SONHOS — /api/pontosdecoleta.js
// ------------------------------------------------------------
// Retorna os pontos de coleta. Filtra por status=ativo
// quando disponível. Tabela padrão: "ponto_coleta".
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ sucesso: false, mensagem: "Método inválido" });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const table = process.env.AIRTABLE_PONTOCOLETA_TABLE || "ponto_coleta";

    // Se o campo "status" existir e for texto, a fórmula filtra só "ativo".
    const records = await base(table)
      .select({
        filterByFormula: "OR({status} = 'ativo', {status} = 'Ativo', {status} = BLANK(), {status} = TRUE())",
        sort: [{ field: "nome_ponto", direction: "asc" }],
        maxRecords: 100
      })
      .all();

    const pontos = records.map((r) => ({ id: r.id, ...r.fields }));

    return res.status(200).json({ sucesso: true, pontos });
  } catch (e) {
    console.error("Erro /api/pontosdecoleta:", e);
    return res.status(500).json({ sucesso: false, mensagem: "Erro ao listar pontos de coleta." });
  }
}
