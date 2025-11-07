// ============================================================
// 📜 VARAL DOS SONHOS — /api/regras_gamificacao.js (versão final TCC)
// ------------------------------------------------------------
// Esta API lista as regras de gamificação cadastradas no Airtable.
// Cada regra define um marco de conquistas (nível, título, faixa mínima etc.)
// e é usada no painel de gamificação do front-end (conquistas.html).
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ------------------------------------------------------------
  // 🔧 Cabeçalhos CORS — permitem acesso pelo Front-End (Vercel)
  // ------------------------------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ------------------------------------------------------------
    // 🔑 Conexão com o Airtable
    // ------------------------------------------------------------
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const tabela = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

    // ------------------------------------------------------------
    // 📥 Busca todas as regras ordenadas por nível e faixa mínima
    // ------------------------------------------------------------
    const registros = await base(tabela)
      .select({
        sort: [
          { field: "nivel_gamificacao", direction: "asc" },
          { field: "faixa_adocoes_min", direction: "asc" },
        ],
      })
      .all();

    // ------------------------------------------------------------
    // 🪄 Formata nomes e campos para uso no front-end
    // ------------------------------------------------------------
    const regras = registros.map((r) => ({
      id: r.id,
      nivel: r.fields.nivel_gamificacao || "Iniciante",
      titulo_conquista: r.fields.titulo_conquista || "",
      faixa_minima: r.fields.faixa_adocoes_min || 0,
      descricao: r.fields.descricao_rotulo_gerada || "",
    }));

    // ------------------------------------------------------------
    // ✅ Retorno para o front-end (JSON limpo)
    // ------------------------------------------------------------
    res.status(200).json({
      sucesso: true,
      total_regras: regras.length,
      regras,
    });
  } catch (e) {
    console.error("❌ Erro /api/regras_gamificacao:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar regras de gamificação.",
      detalhe: e.message,
    });
  }
}
