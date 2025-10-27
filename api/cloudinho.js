// ============================================================
// 💬 VARAL DOS SONHOS — /api/cloudinho.js (v2)
// ------------------------------------------------------------
// Busca respostas na tabela "cloudinho" (Airtable)
// Campos esperados: pergunta, palavras_chave, resposta
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

function normalizar(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ sucesso: false, mensagem: "Método inválido" });

  const { pergunta } = req.body || {};
  if (!pergunta)
    return res.status(400).json({ sucesso: false, mensagem: "Pergunta vazia" });

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const registros = await base("cloudinho").select({ maxRecords: 200 }).all();
    const termo = normalizar(pergunta);

    // Match exato no campo pergunta
    for (const rec of registros) {
      const perg = normalizar(rec.fields["pergunta"] || "");
      if (termo === perg) {
        return res.status(200).json({
          sucesso: true,
          resposta: rec.fields["resposta"] || "💭 Ainda não tenho resposta.",
        });
      }
    }

    // Match parcial por palavras_chave
    for (const rec of registros) {
      const chaves = normalizar(rec.fields["palavras_chave"] || "")
        .split(/[,;]+/)
        .map((c) => c.trim())
        .filter(Boolean);
      if (chaves.some((kw) => termo.includes(kw))) {
        return res.status(200).json({
          sucesso: true,
          resposta: rec.fields["resposta"] || "💭 Ainda não tenho resposta.",
        });
      }
    }

    // Se nada for encontrado
    res.status(200).json({
      sucesso: true,
      resposta:
        "☁️ Hmm... não encontrei nas nuvens. Pode perguntar de outro jeito? 💙",
    });
  } catch (erro) {
    console.error("Erro /api/cloudinho:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar resposta no Airtable.",
      detalhe: erro.message,
    });
  }
}
