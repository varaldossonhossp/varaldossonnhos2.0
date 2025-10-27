// ============================================================
// 🏆 VARAL DOS SONHOS — /api/gamificacao.js
// Sistema de gamificação (tabelas: “gamificacao” e “regras_gamificacao”)
// ------------------------------------------------------------
//   • GET  → retorna ranking de usuários
//   • POST → soma pontos conforme a ação informada
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ======================================
    // 📊 GET — lista ranking
    // ======================================
    if (req.method === "GET") {
      const records = await base("gamificacao").select().all();
      const ranking = records
        .map((r) => ({
          id: r.id,
          nome_usuario: r.fields.nome_usuario,
          pontos: r.fields.pontos || 0,
          nivel: r.fields.nivel || "Iniciante",
          medalhas: r.fields.medalhas || [],
        }))
        .sort((a, b) => b.pontos - a.pontos);

      return res.status(200).json({ sucesso: true, ranking });
    }

    // ======================================
    // 🪙 POST — registra pontos por ação
    // ======================================
    if (req.method === "POST") {
      const { id_usuario, acao } = req.body;

      if (!id_usuario || !acao) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Campos obrigatórios ausentes (id_usuario, acao).",
        });
      }

      // 1️⃣ Busca regra da ação
      const regras = await base("regras_gamificacao")
        .select({ filterByFormula: `{acao}='${acao}'`, maxRecords: 1 })
        .firstPage();

      if (regras.length === 0) {
        return res
          .status(404)
          .json({ sucesso: false, mensagem: "Ação não encontrada." });
      }

      const pontos = regras[0].fields.pontos || 0;

      // 2️⃣ Busca usuário no ranking
      const usuarios = await base("gamificacao")
        .select({ filterByFormula: `{id_usuario}='${id_usuario}'`, maxRecords: 1 })
        .firstPage();

      if (usuarios.length === 0) {
        // ➕ Se não existe, cria novo registro
        await base("gamificacao").create([
          {
            fields: {
              id_usuario,
              pontos,
              nome_usuario: `Usuário ${id_usuario}`,
            },
          },
        ]);
      } else {
        // 🔁 Se já existe, soma pontos
        const id = usuarios[0].id;
        const pontosAtuais = usuarios[0].fields.pontos || 0;
        await base("gamificacao").update(id, {
          pontos: pontosAtuais + pontos,
        });
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: `+${pontos} pontos adicionados com sucesso!`,
      });
    }

    res.status(405).json({ sucesso: false, mensagem: "Método não permitido." });
  } catch (erro) {
    console.error("Erro na gamificação:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno.", erro: erro.message });
  }
}
