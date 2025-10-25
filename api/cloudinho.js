// ============================================================
// ☁️ VARAL DOS SONHOS — /api/cloudinho.js
// ------------------------------------------------------------
// Busca respostas automáticas da tabela "cloudinho" (Airtable).
// Campos esperados: pergunta, resposta, ativo
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const pergunta = (req.query.pergunta || "").toLowerCase();

  try {
    const records = await base("cloudinho")
      .select({
        filterByFormula: `AND(ativo, FIND(LOWER("${pergunta}"), LOWER({pergunta})))`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      res.status(200).json({ resposta: records[0].fields.resposta });
    } else {
      res.status(200).json({
        resposta:
          "Desculpe, ainda não sei responder isso. Você pode entrar em contato conosco pela página Fale Conosco 💙",
      });
    }
  } catch (err) {
    console.error("Erro no Cloudinho API:", err);
    res.status(500).json({ resposta: "Erro ao acessar base de dados 😢" });
  }
}
