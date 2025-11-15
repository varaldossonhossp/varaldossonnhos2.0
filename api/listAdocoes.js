// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js (REVISADA)
// ------------------------------------------------------------
// Retorna TODAS as adoções da tabela "adocoes" com dados
// resumidos para os painéis de logística (admin + ponto).
// - Usa o ID do REGISTRO (record.id) em id_record
// - Não depende de nomes de campos "id_adocao" etc.
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ sucesso: false, mensagem: "Método não permitido" });
  }

  try {
    // 👇 Tabela correta: "adocoes"
    const records = await base("adocoes")
      .select({
        sort: [{ field: "id_doacao", direction: "asc" }], // se esse campo existir
      })
      .all();

    const adocoes = records.map((r) => {
      const f = r.fields || {};

      return {
        // ID do registro no Airtable (usado em /api/confirmar e /api/logistica)
        id_record: r.id,

        // Campos de apoio (não quebram se não existirem)
        id_doacao: f.id_doacao || null,
        status_adocao: f.status_adocao || "aguardando confirmacao",

        // Criança / sonho (usa o que estiver configurado na base)
        nome_crianca:
          f.nome_crianca ||
          f["nome_crianca (from nome_crianca) 2"] ||
          f["nome_crianca (from nome_crianca)"] ||
          "",

        sonho:
          f.sonho ||
          f["sonho (from nome_crianca) 2"] ||
          f["sonho (from nome_crianca)"] ||
          "",

        // Doador
        nome_doador:
          f.nome_doador ||
          f.nome_usuario ||
          f["nome_usuario (from id_usuario)"] ||
          "",

        email_doador:
          f.email_doador ||
          f.email_usuario ||
          f["email_usuario (from id_usuario)"] ||
          "",

        // Ponto / datas (se existirem)
        ponto_coleta: f.ponto_coleta || f["ponto_coleta (from ...)"] || "",
        data_limite_recebimento: f.data_limite_recebimento || "",
      };
    });

    return res.status(200).json({ sucesso: true, adocoes });
  } catch (err) {
    console.error("Erro ao listar adoções:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar adoções.",
      detalhe: err.message,
    });
  }
}
