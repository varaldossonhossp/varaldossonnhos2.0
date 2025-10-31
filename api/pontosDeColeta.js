// ============================================================
// 💙 VARAL DOS SONHOS — /api/pontosdecoleta.js (versão final)
// ------------------------------------------------------------
// Retorna pontos de coleta do Airtable (tabela: pontos_coleta)
// Compatível com front web e app .NET MAUI
// ============================================================

import Airtable from "airtable";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  try {
    // 🔹 Conexão com Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // 🔹 Define tabela (padrão: pontos_coleta)
    const tabela = base(process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta");

    // 🔹 Busca registros ordenados
    const registros = await tabela
      .select({
        maxRecords: 100,
        sort: [{ field: "nome_ponto", direction: "asc" }],
      })
      .all();

    // 🔹 Mapeia campos usados no front
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

    // 🔹 Filtra apenas ativos
    const ativos = pontos.filter(
      (p) => p.status && p.status.toLowerCase() === "ativo"
    );

    // 🔹 Retorno padronizado (usado no front e no .NET MAUI)
    res.status(200).json({
      sucesso: true,
      origem: "Airtable",
      total: ativos.length,
      pontos: ativos,
    });
  } catch (erro) {
    console.error("❌ Erro na rota /api/pontosdecoleta:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar pontos de coleta.",
      detalhes: erro.message,
    });
  }
}
