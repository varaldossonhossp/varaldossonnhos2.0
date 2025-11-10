import Airtable from "airtable";

export const config = { runtime: "nodejs" };

async function fetchComRetry(acao, tentativas = 3, delayMs = 1000) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await acao();
    } catch (erro) {
      console.warn(`⚠️ Tentativa ${i + 1} falhou: ${erro.message}`);
      if (i === tentativas - 1) throw erro;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
  const tabela = base(process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta");

  try {
    if (req.method === "GET") {
      const registros = await fetchComRetry(() =>
        tabela
          .select({ maxRecords: 100, sort: [{ field: "nome_ponto", direction: "asc" }] })
          .all()
      );

      const pontos = registros.map((r) => ({
        id_ponto: r.id,
        nome_ponto: r.get("nome_ponto") || "Ponto sem nome",
        endereco: r.get("endereco") || "Endereço não informado",
        telefone: r.get("telefone") || "—",
        email_ponto: r.get("email_ponto") || "—",
        horario: r.get("horario") || "Horário não informado",
        responsavel: r.get("responsavel") || "—",
        status: r.get("status") || "ativo",
        data_cadastro: r.get("data_cadastro") || r._rawJson.createdTime,
      }));

      return res.status(200).json({ sucesso: true, pontos });

    } else if (req.method === "POST") {
      const novo = await tabela.create([{ fields: req.body }]);
      return res.status(201).json({
        sucesso: true,
        ponto: {
          id_ponto: novo[0].id,
          ...req.body
        }
      });

    } else if (req.method === "PATCH") {
      const { id_ponto, ...fields } = req.body;
      if (!id_ponto) return res.status(400).json({ sucesso: false, mensagem: "ID do ponto é obrigatório" });

      const atualizado = await tabela.update([{ id: id_ponto, fields }]);
      return res.status(200).json({
        sucesso: true,
        ponto: {
          id_ponto: atualizado[0].id,
          ...fields
        }
      });

    } else if (req.method === "DELETE") {
      const { id_ponto } = req.body;
      if (!id_ponto) return res.status(400).json({ sucesso: false, mensagem: "ID do ponto é obrigatório" });

      await tabela.destroy([id_ponto]);
      return res.status(200).json({ sucesso: true, mensagem: "Ponto excluído" });

    } else {
      res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
      return res.status(405).end(`Método ${req.method} não permitido`);
    }
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ sucesso: false, mensagem: erro.message });
  }
}

