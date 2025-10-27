// ============================================================
// 💬 VARAL DOS SONHOS — /api/cloudinho.js
// ------------------------------------------------------------
// Busca inteligente de respostas no Airtable (Cloudinho Bot)
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método inválido" });
  }

  const { pergunta } = req.body;
  if (!pergunta) {
    return res.status(400).json({ sucesso: false, mensagem: "Pergunta vazia" });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const registros = await base("cloudinho").select({ maxRecords: 100 }).all();
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

    res.status(200).json({
      sucesso: true,
      resposta: "Hmm... não encontrei nas nuvens 💙. Pode perguntar de outro jeito?",
    });
  } catch (e) {
    console.error("Erro /api/cloudinho:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar respostas.",
      detalhe: e.message,
    });
  }
}
