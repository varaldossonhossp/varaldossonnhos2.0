// ============================================================
// ☁️ VARAL DOS SONHOS — /api/cloudinho.js
// ------------------------------------------------------------
// Chatbot Cloudinho: busca respostas na tabela "cloudinho".
// Campos: pergunta, palavras_chave, resposta
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const table = process.env.AIRTABLE_CLOUDINHO_TABLE || "cloudinho";

    if (req.method === "POST") {
      const { pergunta } = req.body || {};
      if (!pergunta)
        return res.status(400).json({ sucesso: false, mensagem: "Pergunta ausente." });

      const registros = await base(table).select().all();

      const texto = pergunta.toLowerCase();
      let melhor = registros.find((r) =>
        (r.fields.palavras_chave || "").toLowerCase().split(",").some((kw) => texto.includes(kw.trim()))
      );

      if (!melhor) {
        melhor = registros.find((r) => texto.includes(r.fields.pergunta?.toLowerCase() || ""));
      }

      if (melhor) {
        return res.status(200).json({
          sucesso: true,
          resposta: melhor.fields.resposta,
          pergunta: melhor.fields.pergunta,
        });
      } else {
        return res.status(200).json({
          sucesso: true,
          resposta:
            "Ainda não aprendi sobre isso 😅. Mas você pode perguntar outra coisa ou falar com nossos voluntários!",
        });
      }
    }

    if (req.method === "GET") {
      const todos = await base(table).select().all();
      const lista = todos.map((r) => ({ id: r.id, ...r.fields }));
      return res.status(200).json({ sucesso: true, base: lista });
    }

    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  } catch (e) {
    console.error("Erro /api/cloudinho:", e);
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}
