// ============================================================
// 🎮 VARAL DOS SONHOS — /api/gamificacao.js (versão TCC)
// ------------------------------------------------------------
// Esta API controla a pontuação, conquistas e progressão de
// nível dos usuários dentro do sistema de gamificação.
// Tabela: "gamificacao" (Airtable)
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ------------------------------------------------------------
  // 🔧 Cabeçalhos CORS
  // ------------------------------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
  const tabela = process.env.AIRTABLE_GAMIFICACAO_TABLE || "gamificacao";

  try {
    // ============================================================
    // 🔹 GET → Consulta o progresso de gamificação de um usuário
    // ============================================================
    if (req.method === "GET") {
      const { id_usuario } = req.query;
      if (!id_usuario)
        return res.status(400).json({ sucesso: false, mensagem: "id_usuario ausente." });

      const registros = await base(tabela)
        .select({ filterByFormula: `{id_usuario}='${id_usuario}'` })
        .all();

      if (registros.length === 0)
        return res.status(200).json({ sucesso: true, gamificacao: null });

      const item = registros[0].fields;
      return res.status(200).json({ sucesso: true, gamificacao: item });
    }

    // ============================================================
    // 🔹 POST → Cria ou atualiza o progresso de gamificação
    // ============================================================
    if (req.method === "POST") {
      const {
        id_usuario,
        pontos_coracao = 0,
        total_cartinhas_adotadas = 0,
        titulo_conquista,
      } = req.body || {};

      if (!id_usuario)
        return res.status(400).json({ sucesso: false, mensagem: "id_usuario obrigatório." });

      // 🔍 Verifica se o usuário já possui um registro
      const existentes = await base(tabela)
        .select({ filterByFormula: `{id_usuario}='${id_usuario}'` })
        .all();

      // ------------------------------------------------------------
      // 🔁 Atualiza o registro existente (incrementa pontos e conquistas)
      // ------------------------------------------------------------
      if (existentes.length > 0) {
        const rec = existentes[0];
        const novosCampos = {
          pontos_coracao,
          total_cartinhas_adotadas,
          titulo_conquista: titulo_conquista || rec.fields.titulo_conquista,
          ultima_atualizacao: new Date().toISOString(),
        };

        await base(tabela).update([{ id: rec.id, fields: novosCampos }]);
        return res.status(200).json({ sucesso: true, atualizado: true });
      }

      // ------------------------------------------------------------
      // 🆕 Cria um novo registro para o usuário iniciante
      // ------------------------------------------------------------
      const novo = {
        id_usuario,
        pontos_coracao,
        total_cartinhas_adotadas,
        titulo_conquista: titulo_conquista || "💙 Iniciante Solidário",
        nivel_atual: 1,
        ultima_atualizacao: new Date().toISOString(),
      };

      const criado = await base(tabela).create([{ fields: novo }]);
      return res.status(200).json({
        sucesso: true,
        criado: true,
        id: criado[0].id,
      });
    }

    // Método inválido
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
