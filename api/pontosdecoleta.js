/* ============================================================
   💙 VARAL DOS SONHOS — API / Pontos de Coleta
   ------------------------------------------------------------
   CRUD completo integrado ao Airtable.
   Funções: listar, criar, editar e excluir pontos de coleta.
   ============================================================ */

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// 🔹 Função auxiliar com tentativas automáticas
async function fetchComRetry(acao, tentativas = 3, delayMs = 1000) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await acao();
    } catch (erro) {
      console.warn(`⚠️ Tentativa ${i + 1} falhou: ${erro.message}`);
      if (i === tentativas - 1) throw erro;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  const tabela = base(process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta");

  try {
    // 🔹 LISTAR
    if (req.method === "GET") {
      const registros = await fetchComRetry(() =>
        tabela.select({ maxRecords: 100, sort: [{ field: "nome_ponto", direction: "asc" }] }).all()
      );

      const pontos = registros.map(r => ({
        id_ponto: r.id,
        nome_ponto: r.get("nome_ponto"),
        endereco: r.get("endereco"),
        telefone: r.get("telefone"),
        email_ponto: r.get("email_ponto"),
        horario: r.get("horario"),
        responsavel: r.get("responsavel"),
        status: r.get("status"),
        data_cadastro: r.get("data_cadastro"),
      }));

      return res.status(200).json({ sucesso: true, pontos });
    }

    // 🔹 CRIAR
    else if (req.method === "POST") {
      const dados = {
        nome_ponto: req.body.nome_ponto,
        endereco: req.body.endereco,
        telefone: req.body.telefone,
        email_ponto: req.body.email_ponto,
        horario: req.body.horario,
        responsavel: req.body.responsavel,
        status: req.body.status || "ativo",
        data_cadastro: new Date().toISOString().split("T")[0],
      };

      const novo = await tabela.create([{ fields: dados }]);
      return res.status(201).json({ sucesso: true, ponto: { id_ponto: novo[0].id, ...dados } });
    }

    // 🔹 EDITAR
    else if (req.method === "PATCH") {
      const { id_ponto, ...fields } = req.body;
      if (!id_ponto) return res.status(400).json({ sucesso: false, mensagem: "ID do ponto é obrigatório" });
      const atualizado = await tabela.update([{ id: id_ponto, fields }]);
      return res.status(200).json({ sucesso: true, ponto: { id_ponto, ...fields } });
    }

    // 🔹 EXCLUIR
    else if (req.method === "DELETE") {
      const { id_ponto } = req.body;
      if (!id_ponto) return res.status(400).json({ sucesso: false, mensagem: "ID do ponto é obrigatório" });
      await tabela.destroy([id_ponto]);
      return res.status(200).json({ sucesso: true, mensagem: "Ponto excluído com sucesso." });
    }

    // 🔹 MÉTODO NÃO SUPORTADO
    else {
      res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
      return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (erro) {
    console.error("Erro API pontos_coleta:", erro);
    return res.status(500).json({ sucesso: false, mensagem: erro.message });
  }
}
