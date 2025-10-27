// ============================================================
// 💬 VARAL DOS SONHOS — /api/cloudinho.js (v2 - robusta)
// - Normaliza acentos/maiúsculas
// - Tenta match exato com "pergunta"
// - Depois tenta match por palavras_chave (parcial)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

function norm(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
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
    const tabela = process.env.AIRTABLE_CLOUDINHO_TABLE || "cloudinho";

    const registros = await base(tabela).select({ maxRecords: 200 }).all();

    const termo = norm(pergunta);

    // 1) Match EXATO com campo "pergunta"
    for (const rec of registros) {
      const perg = norm(rec.fields["pergunta"]);
      if (perg && perg === termo) {
        return res.status(200).json({
          sucesso: true,
          resposta: rec.fields["resposta"] || "💭 Ainda não tenho resposta para isso.",
        });
      }
    }

    // 2) Match por palavras_chave (ignora acentos/plural)
    for (const rec of registros) {
      const chavesRaw = norm(rec.fields["palavras_chave"]);
      if (!chavesRaw) continue;

      const chaves = chavesRaw
        .split(/[,;]+/)
        .map(w => w.trim())
        .filter(Boolean);

      if (chaves.some(kw => termo.includes(kw))) {
        return res.status(200).json({
          sucesso: true,
          resposta: rec.fields["resposta"] || "💭 Ainda não tenho resposta para isso.",
        });
      }
    }

    // 3) Tentativa bônus: comparar tokens da pergunta com tokens das chaves
    const tokensPerg = termo.split(/\W+/).filter(Boolean);
    for (const rec of registros) {
      const chavesRaw = norm(rec.fields["palavras_chave"]);
      const chaves = chavesRaw ? chavesRaw.split(/[,;]+/).map(s => s.trim()) : [];
      if (chaves.length === 0) continue;

      const hit = tokensPerg.some(tok => chaves.some(kw => kw && tok.startsWith(kw)));
      if (hit) {
        return res.status(200).json({
          sucesso: true,
          resposta: rec.fields["resposta"] || "💭 Ainda não tenho resposta para isso.",
        });
      }
    }

    return res.status(200).json({
      sucesso: true,
      resposta:
        "☁️ Hmm... não encontrei nas nuvens. Pode perguntar de outro jeito? 💙",
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
