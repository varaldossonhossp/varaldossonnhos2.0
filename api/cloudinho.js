// ============================================================
// 💬 VARAL DOS SONHOS — /api/cloudinho.js (Versão Inteligente)
// ------------------------------------------------------------
// Base de conhecimento do Cloudinho (100% FREE, sem IA paga)
//
// Tabela no Airtable: "cloudinho"
// Campos esperados:
//   - pergunta        (texto livre)
//   - palavras_chave  (string "adoção, cartinha, presente" OU ARRAY)
//   - resposta        (texto HTML ou texto simples)
//
// Lógica de "inteligência":
//   1) Normaliza a pergunta do usuário (sem acento, minúscula, trim)
//   2) Para cada registro: calcula uma pontuação de relevância
//      • +100 se match EXATO com {pergunta}
//      • +40 se a pergunta cadastrada está contida na pergunta do usuário
//      • +20 por cada palavra-chave contida na pergunta
//      • +10 se a palavra-chave contém a pergunta
//      • +8 se a distância (Levenshtein) for pequena (erro de digitação)
//   3) Escolhe o registro com maior pontuação
//   4) Se a pontuação for muito baixa → responde fallback amigável
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// --------------------------
// Normalização básica
// --------------------------
function normalizar(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// --------------------------
// Distância de Levenshtein (simples)
// --------------------------
function distanciaLevenshtein(a = "", b = "") {
  a = normalizar(a);
  b = normalizar(b);

  const n = a.length;
  const m = b.length;
  if (!n) return m;
  if (!m) return n;

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // remoção
        dp[i][j - 1] + 1,        // inserção
        dp[i - 1][j - 1] + custo // substituição
      );
    }
  }

  return dp[n][m];
}

// --------------------------
// Pontuação de um registro do Airtable
// --------------------------
function pontuarRegistro(rec, termoNormalizado) {
  if (!termoNormalizado) return 0;

  const fields = rec.fields || {};

  const perguntaBruta = fields["pergunta"] || "";
  const perguntaNorm = normalizar(perguntaBruta);

  // palavras_chave pode ser string OU array
  const brutoChaves = fields["palavras_chave"] || "";
  let listaChaves = [];

  if (Array.isArray(brutoChaves)) {
    listaChaves = brutoChaves.map((x) => normalizar(x));
  } else if (typeof brutoChaves === "string") {
    listaChaves = brutoChaves
      .split(/[,;]+/)
      .map((c) => normalizar(c))
      .filter(Boolean);
  }

  let score = 0;

  // 1) Match EXATO com pergunta cadastrada
  if (termoNormalizado === perguntaNorm) {
    score += 100;
  } else {
    // Match parcial com pergunta
    if (
      termoNormalizado.includes(perguntaNorm) ||
      perguntaNorm.includes(termoNormalizado)
    ) {
      score += 40;
    }
  }

  // 2) Match com palavras-chave
  for (const kw of listaChaves) {
    if (!kw) continue;

    if (termoNormalizado.includes(kw)) {
      score += 20;
    } else if (kw.includes(termoNormalizado)) {
      score += 10;
    } else {
      const dist = distanciaLevenshtein(termoNormalizado, kw);
      if (dist > 0 && dist <= 2) {
        score += 8; // tolerância para erros de digitação
      }
    }
  }

  // 3) Bônus para perguntas mais elaboradas
  if (listaChaves.length && termoNormalizado.split(/\s+/).length >= 2) {
    score += 5;
  }

  return score;
}

// --------------------------
// Handler principal da API
// --------------------------
export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ sucesso: false, mensagem: "Método inválido. Use POST." });
  }

  const { pergunta } = req.body || {};
  if (!pergunta || !String(pergunta).trim()) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Pergunta vazia. Me conta melhor o que você quer saber 💙",
    });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const registros = await base("cloudinho")
      .select({ maxRecords: 200 })
      .all();

    const termo = normalizar(pergunta);

    let melhor = null;
    let melhorScore = 0;

    for (const rec of registros) {
      const score = pontuarRegistro(rec, termo);
      if (score > melhorScore) {
        melhorScore = score;
        melhor = rec;
      }
    }

    const LIMIAR = 10;

    if (melhor && melhorScore >= LIMIAR) {
      return res.status(200).json({
        sucesso: true,
        resposta:
          melhor.fields["resposta"] ||
          "💭 Ainda não tenho uma resposta prontinha para isso, mas estou aprendendo!",
        score: melhorScore,
      });
    }

    return res.status(200).json({
      sucesso: true,
      resposta:
        "☁️ Hmm... não encontrei isso nas nuvens agora. Tenta perguntar de outro jeitinho pra mim? 💙",
      score: 0,
    });
  } catch (erro) {
    console.error("🔥 Erro /api/cloudinho:", erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar resposta no Airtable.",
      detalhe: erro.message,
    });
  }
}
