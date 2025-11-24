// ============================================================
// 🎮 VARAL DOS SONHOS — /api/gamificacao.js 
// ------------------------------------------------------------
// Sistema de gamificação:
// • Busca e atualiza gamificação por e-mail do usuário
// • Campos usados no Airtable:
//   - email_usuario (lookup vindo de usuario)
//   - pontos_coracao
//   - total_adocoes
//   - nivel_gamificacao_atual
//   - titulo_conquista_atual
//   - data_ultima_atualizacao
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
    // 🔹 GET — consulta a gamificação pelo e-mail
    // ============================================================
    if (req.method === "GET") {
      const { email_usuario } = req.query;

      if (!email_usuario)
        return res.status(400).json({ sucesso: false, mensagem: "email_usuario ausente." });

      // Busca por e-mail
      const registros = await base(tabela)
        .select({
          filterByFormula: `SEARCH('${email_usuario}', {email_usuario})`
        })
        .all();

      if (registros.length === 0)
        return res.status(200).json({ sucesso: true, gamificacao: null });

      const g = registros[0].fields;

      return res.status(200).json({
        sucesso: true,
        gamificacao: {
          nivel_gamificacao_atual: g.nivel_gamificacao_atual || "Iniciante",
          pontos_coracao: g.pontos_coracao || 0,
          total_cartinhas_adotadas: g.total_adocoes || 0,
          titulo_conquista_atual: g.titulo_conquista_atual || "💙 Iniciante Solidário",
          data_ultima_atualizacao: g.data_ultima_atualizacao || null,
        }
      });
    }

    // ============================================================
    // 🔹 POST — cria ou atualiza automaticamente
    // ============================================================
    if (req.method === "POST") {
      const {
        email_usuario,
        pontos_coracao = 0,
        total_cartinhas_adotadas = 0,
        titulo_conquista_atual = "💙 Iniciante Solidário",
        nivel_gamificacao_atual = "Iniciante"
      } = req.body || {};

      if (!email_usuario)
        return res.status(400).json({ sucesso: false, mensagem: "email_usuario é obrigatório." });

      const existentes = await base(tabela)
        .select({
          filterByFormula: `SEARCH('${email_usuario}', {email_usuario})`
        })
        .all();

      const campos = {
        email_usuario,
        pontos_coracao,
        total_adocoes: total_cartinhas_adotadas,
        nivel_gamificacao_atual,
        titulo_conquista_atual,
        data_ultima_atualizacao: new Date().toISOString(),
      };

      // Atualiza se já existir
      if (existentes.length > 0) {
        await base(tabela).update([
          { id: existentes[0].id, fields: campos }
        ]);

        return res.status(200).json({ sucesso: true, atualizado: true });
      }

      // Cria novo registro
      const criado = await base(tabela).create([{ fields: campos }]);

      return res.status(200).json({ sucesso: true, criado: true, id: criado[0].id });
    }

    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });

  } catch (e) {
    console.error("Erro /api/gamificacao:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno na gamificação.",
      detalhe: e.message
    });
  }
}
