// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js
// ------------------------------------------------------------
// Função:
//   • Fornece uma lista RESUMIDA de todas as adoções para os
//     painéis de logística (admin + pontos de coleta).
//
// Como é usado:
//   • pages/logistica-admin.html  → carrega todas as adoções
//   • js/logistica-admin.js       → filtra por status_adocao
//
// Campos garantidos no retorno de cada adoção:
//   - id_record        → ID do registro na tabela "adocoes" (Airtable)
//   - id_cartinha      → número da cartinha (lookup da tabela cartinha)
//   - nome_crianca     → nome da criança
//   - sonho            → sonho / presente
//   - nome_usuario     → nome do doador
//   - email_usuario    → e-mail do doador
//   - telefone_usuario → telefone do doador
//   - nome_ponto       → nome do ponto de coleta
//   - status_adocao    → situação da adoção
//
// Status usados no fluxo de logística:
//   • "aguardando confirmacao"
//   • "confirmada"
//   • "presente recebido"
//   • "presente entregue"
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Apenas GET é permitido
  if (req.method !== "GET") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido.",
    });
  }

  try {
    // Nome da tabela pode vir do .env (mais flexível)
    const tabelaAdocoes = process.env.AIRTABLE_ADOCOES_TABLE || "adocoes";

    // Busca TODAS as adoções (poderia ser paginada no futuro)
    const records = await base(tabelaAdocoes)
      .select({
        // Se existir o campo id_doacao, ordena por ele
        sort: [{ field: "id_doacao", direction: "asc" }],
      })
      .all();

    // Mapeia os registros para um formato mais simples para o front
    const adocoes = records.map((r) => {
      const f = r.fields || {};

      return {
        // ID do registro no Airtable (é o que usamos em /api/confirmar e /api/logistica)
        id_record: r.id,

        // ID numérico da cartinha (lookup da tabela "cartinha")
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

        // Status da adoção usado no painel de logística
        status_adocao: f.status_adocao || "aguardando confirmacao",
      };
    });

    // Resposta final
    return res.status(200).json({
      sucesso: true,
      adocoes,
    });
  } catch (err) {
    console.error("❌ Erro ao listar adoções:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar adoções.",
      detalhe: err.message,
    });
  }
}
