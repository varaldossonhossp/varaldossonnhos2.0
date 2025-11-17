// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js (CORRIGIDA FINAL)
// ------------------------------------------------------------
// Fornece lista completa para painéis de logística (admin/ponto).
// Campos garantidos:
//  - id_record
//  - id_cartinha
//  - nome_crianca
//  - sonho
//  - nome_usuario (doador)
//  - email_usuario
//  - nome_ponto
//  - status_adocao
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido.",
    });
  }

  try {
    const records = await base("adocoes")
      .select({ sort: [{ field: "id_doacao", direction: "asc" }] })
      .all();

    const adocoes = records.map((r) => {
      const f = r.fields || {};

      return {
        id_record: r.id,

        // ID numérico da cartinha (lookup)
        id_cartinha:
          f.id_cartinha ||
          f["id_cartinha (from nome_crianca)"] ||
          f["id_cartinha (from nome_crianca) 2"] ||
          null,

        // Dados da criança
        nome_crianca:
          f.nome_crianca ||
          f["nome_crianca (from nome_crianca)"] ||
          f["nome_crianca (from nome_crianca) 2"] ||
          "",

        sonho:
          f.sonho ||
          f["sonho (from nome_crianca)"] ||
          f["sonho (from nome_crianca) 2"] ||
          "",

        // Dados do doador
        nome_usuario:
          f.nome_usuario ||
          f["nome_usuario (from usuario)"] ||
          f["nome_usuario (from id_usuario)"] ||
          "",

        email_usuario:
          f.email_usuario ||
          f["email_usuario (from usuario)"] ||
          f["email_usuario (from id_usuario)"] ||
          "",

        telefone_usuario:
          f.telefone ||
          f["telefone (from usuario)"] ||
          f["telefone (from id_usuario)"] ||
          "",

        // Ponto de coleta
        nome_ponto:
          f.nome_ponto ||
          f["nome_ponto (from pontos_coleta)"] ||
          f["nome_ponto (from pontos_coleta) 2"] ||
          "",

        status_adocao: f.status_adocao || "aguardando confirmacao",
      };
    });

    return res.status(200).json({ sucesso: true, adocoes });

  } catch (err) {
    console.error("❌ Erro ao listar adoções:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar adoções.",
      detalhe: err.message,
    });
  }
}
