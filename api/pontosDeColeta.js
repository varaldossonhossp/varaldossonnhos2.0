// ============================================================
// 💙 VARAL DOS SONHOS — API: Pontos de Coleta (versão final)
// ------------------------------------------------------------
// • Lê tabela "pontos_coleta" no Airtable
// • Retorna pontos ativos (status = "ativo")
// • Compatível com o carrinho.js e .NET MAUI
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const tabela = base(process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta");

    const registros = await tabela
      .select({
        maxRecords: 100,
        sort: [{ field: "nome_ponto", direction: "asc" }],
      })
      .all();

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

    const ativos = pontos.filter(
      (p) => p.status && p.status.toLowerCase() === "ativo"
    );

    return res.status(200).json({
      sucesso: true,
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
