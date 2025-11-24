// ============================================================
// 📜 VARAL DOS SONHOS — /api/regras_gamificacao.js 
// ------------------------------------------------------------
// Lista as regras da tabela regras_gamificacao no Airtable
// Campos usados:
//  - nivel_gamificacao
//  - faixa_adocoes_min
//  - titulo_conquista
//  - descricao_rotulo_gerada
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

    const tabela = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

    const registros = await base(tabela)
      .select({
        sort: [
          { field: "faixa_adocoes_min", direction: "asc" }
        ]
      })
      .all();

    const regras = registros.map(r => ({
      id: r.id,
      nivel: r.fields.nivel_gamificacao || "",
      titulo_conquista: r.fields.titulo_conquista || "",
      faixa_minima: r.fields.faixa_adocoes_min || 0,
      descricao: r.fields.descricao_rotulo_gerada || "",
    }));

    return res.status(200).json({
      sucesso: true,
      total_regras: regras.length,
      regras
    });

  } catch (e) {
    console.error("❌ Erro /api/regras_gamificacao:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar regras de gamificação.",
      detalhe: e.message,
    });
  }
}
