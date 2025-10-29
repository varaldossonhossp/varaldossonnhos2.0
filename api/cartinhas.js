// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinhas.js
// ------------------------------------------------------------
// Lista cartinhas disponíveis e ativas para adoção.
// Tabela: cartinha (CORRIGIDO)
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
    
    // CORREÇÃO: O fallback agora é "cartinha" no singular.
    // O nome da variável de ambiente é mantido por compatibilidade.
    const table = process.env.AIRTABLE_CARTINHAS_TABLE || "cartinha"; 

    const records = await base(table)
      .select({
        filterByFormula: "AND({status}='disponível', {ativo}=1)",
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
      .json({ sucesso: false, mensagem: "Erro ao listar cartinhas. Nome da Tabela ou Permissões Incorretas.", detalhe: e.message });
  }
}