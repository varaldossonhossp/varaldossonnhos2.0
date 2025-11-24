// ============================================================
// 🎮 VARAL DOS SONHOS — /api/gamificacao_unificada.js
// ------------------------------------------------------------
// Retorna em UMA requisição:
// • Dados de gamificação do usuário (busca por EMAIL)
// • Lista completa das regras de gamificação
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  const tabelaGami = process.env.AIRTABLE_GAMIFICACAO_TABLE || "gamificacao";
  const tabelaRegras = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

  try {
    // ============================================================
    // 🔹 GET — Consulta gamificação + regras_gamificacao
    // ============================================================
    if (req.method === "GET") {
      const { email_usuario } = req.query;

      if (!email_usuario) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "email_usuario é obrigatório."
        });
      }

      // ------------------------------------------------------------
      // 🔍 Buscar gamificação pelo EMAIL (lookup)
      // ------------------------------------------------------------
      const registrosG = await base(tabelaGami)
        .select({
          filterByFormula: `LOWER({email_usuario}) = '${String(email_usuario).toLowerCase()}'`
        })
        .all();

      let gamificacao = null;

      if (registrosG.length > 0) {
        const g = registrosG[0].fields;

        gamificacao = {
          nivel_gamificacao_atual: g.nivel_gamificacao_atual || "Iniciante",
          pontos_coracao: g.pontos_coracao || 0,
          total_cartinhas_adotadas: g.total_adocoes || 0,
          titulo_conquista_atual: g.titulo_conquista_atual || "",
          data_ultima_atualizacao: g.data_ultima_atualizacao || null
        };
      }

      // ------------------------------------------------------------
      // 📜 Buscar todas regras de gamificação
      // ------------------------------------------------------------
      const registrosR = await base(tabelaRegras)
        .select({
          sort: [
            { field: "faixa_adocoes_min", direction: "asc" }
          ]
        })
        .all();

      const regras = registrosR.map(r => ({
        id: r.id,
        nivel: r.fields.nivel_gamificacao || "",
        titulo_conquista: r.fields.titulo_conquista || "",
        faixa_minima: r.fields.faixa_adocoes_min || 0,
        descricao: r.fields.descricao_rotulo_gerada || ""
      }));

      return res.status(200).json({
        sucesso: true,
        gamificacao,
        regras
      });
    }

    // ============================================================
    // 🔹 POST — Criar ou atualizar gamificação
    // ============================================================
    if (req.method === "POST") {
      const { email_usuario, pontos_coracao = 0, total_cartinhas_adotadas = 0, titulo_conquista_atual = "" } =
        req.body || {};

      if (!email_usuario) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "email_usuario é obrigatório."
        });
      }

      const existentes = await base(tabelaGami)
        .select({
          filterByFormula: `LOWER({email_usuario}) = '${String(email_usuario).toLowerCase()}'`
        })
        .all();

      const novosCampos = {
        pontos_coracao,
        total_adocoes: total_cartinhas_adotadas,
        titulo_conquista_atual,
        data_ultima_atualizacao: new Date().toISOString()
      };

      if (existentes.length > 0) {
        // atualizar
        await base(tabelaGami).update([
          {
            id: existentes[0].id,
            fields: novosCampos
          }
        ]);

        return res.status(200).json({
          sucesso: true,
          atualizado: true
        });
      }

      // criar novo
      const criado = await base(tabelaGami).create([
        {
          fields: {
            ...novosCampos,
            nivel_gamificacao_atual: "Iniciante"
          }
        }
      ]);

      return res.status(200).json({
        sucesso: true,
        criado: true,
        id: criado[0].id
      });
    }

    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não suportado."
    });

  } catch (e) {
    console.error("❌ API ERRO gamificacao_unificada:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno na gamificação.",
      detalhe: e.message
    });
  }
}
