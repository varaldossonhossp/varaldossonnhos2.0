// ============================================================
// 💙 VARAL DOS SONHOS — /api/pontosdecoleta.js
// ------------------------------------------------------------
// Retorna os pontos de coleta do Airtable.
// Tabela: pontos_coleta
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  try {
    // 🔹 Configuração base
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const tabela = base(process.env.AIRTABLE_PONTOS_TABLE);

    // 🔹 Busca todos os registros (limite opcional)
    const registros = await tabela.select({ maxRecords: 50 }).all();

    // 🔹 Mapeia campos (usando os nomes que o FRONT espera)
    const pontos = registros.map((r) => ({
      id_ponto: r.id,
      nome_ponto: r.get("nome_ponto") || "—",
      endereco: r.get("endereco") || "—",
      responsavel: r.get("responsavel") || "—",
      telefone: r.get("telefone") || "—",
      email_ponto: r.get("email_ponto") || "—",
      // ⬇️ importante: mudar para o mesmo nome que o front usa
      horario_funcionamento: r.get("horario") || "—",
      status: r.get("status") || "ativo",
    }));

    // 🔹 Filtra apenas os ativos (já para evitar erro no front)
    const ativos = pontos.filter(
      (p) => p.status && p.status.toLowerCase() === "ativo"
    );

    res.status(200).json({
      sucesso: true,
      total: ativos.length,
      pontos: ativos,
    });
  } catch (erro) {
    console.error("Erro na rota /api/pontosdecoleta:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar pontos de coleta.",
      erro: erro.message,
    });
  }
}
