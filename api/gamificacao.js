// ============================================================
// 🎮 VARAL DOS SONHOS — /api/gamificacao.js (corrigida)
// ------------------------------------------------------------
// Controla pontuação, conquistas e progressão de nível dos usuários
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
  const tabela = process.env.AIRTABLE_GAMIFICACAO_TABLE || "gamificacao";

  try {
    // ============================================================
    // 🔹 GET → Consulta o progresso do usuário
    // ============================================================
    if (req.method === "GET") {
      const { id_usuario } = req.query;
      if (!id_usuario)
        return res.status(400).json({ sucesso: false, mensagem: "id_usuario ausente." });

      // Busca pelo link do usuário
      const registros = await base(tabela)
        .select({ filterByFormula: `SEARCH('${id_usuario}', ARRAYJOIN(usuario))` })
        .all();

      if (registros.length === 0)
        return res.status(200).json({ sucesso: true, gamificacao: null });

      const g = registros[0].fields;

      // Mapeamento para o front-end
      const gamificacao = {
        nivel_gamificacao_atual: g.nivel_gamificacao_atual || "Iniciante",
        pontos_coracao: g.pontos_coracao || 0,
        total_cartinhas_adotadas: g.total_adocoes || 0,
        titulo_conquista_atual: g.titulo_conquista_atual || "💙 Iniciante Solidário",
        data_ultima_atualizacao: g.data_ultima_atualizacao || null,
      };

      return res.status(200).json({ sucesso: true, gamificacao });
    }

    // ============================================================
    // 🔹 POST → Atualiza ou cria registro
    // ============================================================
    if (req.method === "POST") {
      const { id_usuario, pontos_coracao = 0, total_cartinhas_adotadas = 0, titulo_conquista_atual } =
        req.body || {};

      if (!id_usuario)
        return res.status(400).json({ sucesso: false, mensagem: "id_usuario obrigatório." });

      const existentes = await base(tabela)
        .select({ filterByFormula: `SEARCH('${id_usuario}', ARRAYJOIN(usuario))` })
        .all();

      const novosCampos = {
        pontos_coracao,
        total_adocoes: total_cartinhas_adotadas,
        titulo_conquista_atual: titulo_conquista_atual || "💙 Iniciante Solidário",
        data_ultima_atualizacao: new Date().toISOString(),
      };

      if (existentes.length > 0) {
        await base(tabela).update([{ id: existentes[0].id, fields: novosCampos }]);
        return res.status(200).json({ sucesso: true, atualizado: true });
      }

      // Cria novo registro
      const criado = await base(tabela).create([
        {
          fields: {
            usuario: [id_usuario], // vincula ao registro do usuário
            ...novosCampos,
            nivel_gamificacao_atual: "Iniciante",
          },
        },
      ]);

      return res.status(200).json({ sucesso: true, criado: true, id: criado[0].id });
    }

    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  } catch (e) {
    console.error("Erro /api/gamificacao:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno na gamificação.",
      detalhe: e.message,
    });
  }
}
