// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js
// ------------------------------------------------------------
// Lista eventos destacados para o carrossel e home pública.
// Campos Airtable (tabela "eventos"):
//  nome_evento, local_evento, descricao, data_evento,
//  data_limite_recebimento, imagem, status_evento,
//  destacar_na_homepage (checkbox)
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";

    const records = await base(table)
      .select({
        filterByFormula:
          "AND({destacar_na_homepage}=1, {status_evento}='em andamento')",
        sort: [{ field: "data_evento", direction: "asc" }],
      })
      .all();

    const eventos = records.map((r) => ({
      id: r.id,
      ...r.fields,
    }));

    res.status(200).json({ sucesso: true, eventos });
  } catch (e) {
    console.error("Erro /api/eventos:", e);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao listar eventos.", detalhe: e.message });
  }
}
