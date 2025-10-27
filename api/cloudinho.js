// ============================================================
// 💬 VARAL DOS SONHOS — /api/cloudinho.js
// ------------------------------------------------------------
// Busca inteligente de respostas no Airtable (Tabela: cloudinho)
// Campos esperados: pergunta | palavras_chave | resposta
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Aceita apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método inválido" });
  }

  const { pergunta } = req.body || {};
  if (!pergunta) {
    return res.status(400).json({ sucesso: false, mensagem: "Pergunta vazia" });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // nome da tabela no .env.local → AIRTABLE_CLOUDINHO_TABLE
    const tabela = process.env.AIRTABLE_CLOUDINHO_TABLE || "cloudinho";
    const registros = await base(tabela).select({ maxRecords: 100 }).all();

    const termo = pergunta.toLowerCase();

    for (const rec of registros) {
      const palavras = (rec.fields["palavras_chave"] || "").toLowerCase();
      const lista = palavras.split(/[,;]+/).map((w) => w.trim());
      if (lista.some((kw) => termo.includes(kw))) {
        return res.status(200).json({
          sucesso: true,
          resposta: rec.fields["resposta"] || "💭 Ainda não tenho resposta para isso.",
        });
      }
    }

    return res.status(200).json({
      sucesso: true,
      resposta: "☁️ Hmm... não encontrei nas nuvens. Pode perguntar de outro jeito? 💙",
    });
  } catch (erro) {
    console.error("Erro /api/cloudinho:", erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar resposta no Airtable.",
      detalhe: erro.message,
    });
  }
}
