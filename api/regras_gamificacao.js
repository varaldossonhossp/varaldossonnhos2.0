// ============================================================
// 📜 VARAL DOS SONHOS — /api/regras_gamificacao.js
// ------------------------------------------------------------
// Lista as regras de gamificação configuradas no Airtable.
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
    const tabela = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

    const registros = await base(tabela)
      .select({ sort: [{ field: "nivel_gamificacao", direction: "asc" }] })
      .all();

    const regras = registros.map((r) => ({
      id: r.id,
      ...r.fields,
    }));

    res.status(200).json({ sucesso: true, regras });
  } catch (e) {
    console.error("Erro /api/regras_gamificacao:", e);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao listar regras.", detalhe: e.message });
  }
}
