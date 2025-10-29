// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinhas.js (Correção de Acento/Capitalização)
// ------------------------------------------------------------
// Usando 'disponivel' (minúsculo, sem acento)
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
    
    const table = process.env.AIRTABLE_CARTINHAS_TABLE || "cartinha"; 

    const records = await base(table)
      .select({
        // CORREÇÃO FINAL: Usando 'disponivel' (minúsculo e SEM ACENTO), conforme a configuração do Single Select
        filterByFormula: "{status}='disponivel'",
        sort: [{ field: "data_cadastro", direction: "desc" }],
      })
      .all();

    const cartinhas = records.map((r) => ({
      id: r.id,
      ...r.fields,
    }));

    res.status(200).json({ sucesso: true, cartinhas });
  } catch (e) {
    console.error("Erro /api/cartinhas:", e);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao listar cartinhas. Verifique se o nome da tabela/campos está correto.", detalhe: e.message });
  }
}