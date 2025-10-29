// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinhas.js (Versão Corrigida FINAL)
// ------------------------------------------------------------

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
        // CORREÇÃO: Removido o filtro 'AND({ativo}=1)' que estava dando erro
        filterByFormula: "{status}='disponível'",
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
    // Mensagem de erro mais genérica, já que agora o erro é de campo
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao listar cartinhas. Verifique os nomes dos campos na API.", detalhe: e.message });
  }
}