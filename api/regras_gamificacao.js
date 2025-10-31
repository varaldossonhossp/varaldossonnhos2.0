// ============================================================
// 📜 VARAL DOS SONHOS — /api/regras_gamificacao.js (versão TCC)
// ------------------------------------------------------------
// Este endpoint lista todas as regras de gamificação cadastradas
// na tabela “regras_gamificacao” do Airtable.
// Cada regra define um marco de conquistas, pontuação mínima
// e nível correspondente (iniciante, intermediário, avançado...).
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ------------------------------------------------------------
  // 🔧 Cabeçalhos CORS — permitem requisições externas (Front-end)
  // ------------------------------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ------------------------------------------------------------
    // 🔑 Conexão segura ao Airtable via variáveis de ambiente
    // ------------------------------------------------------------
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const tabela = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

    // ------------------------------------------------------------
    // 📥 Busca todas as regras, ordenando por nível
    // ------------------------------------------------------------
    const registros = await base(tabela)
      .select({ sort: [{ field: "nivel_gamificacao", direction: "asc" }] })
      .all();

    // ------------------------------------------------------------
    // 🔄 Formata a resposta para o front-end
    // ------------------------------------------------------------
    const regras = registros.map((r) => ({
      id: r.id,
      ...r.fields,
    }));

    // ✅ Retorno bem-sucedido
    res.status(200).json({ sucesso: true, regras });
  } catch (e) {
    console.error("Erro /api/regras_gamificacao:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar regras de gamificação.",
      detalhe: e.message,
    });
  }
}
