// ============================================================
// 💙 VARAL DOS SONHOS — API: Pontos de Coleta 
// ------------------------------------------------------------
// • Lê tabela "pontos_coleta" no Airtable
// • Retorna pontos ativos (status = "ativo")
// • Inclui retry automático e timeout contra lentidão do Airtable
// • Compatível com carrinho.js e .NET MAUI
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Função auxiliar: retry automático com delay
async function fetchComRetry(acao, tentativas = 3, delayMs = 1000) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await acao();
    } catch (erro) {
      console.warn(`⚠️ Tentativa ${i + 1} falhou: ${erro.message}`);
      if (i === tentativas - 1) throw erro; // se for a última, lança o erro
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export default async function handler(req, res) {
  const timeoutMs = 8000; // ⏱️ tempo máximo por requisição (8s)

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const tabela = base(process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta");

    // Aplica timeout e retry no carregamento
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const registros = await fetchComRetry(async () => {
      return await tabela
        .select({
          maxRecords: 100,
          sort: [{ field: "nome_ponto", direction: "asc" }],
        })
        .all();
    });

    clearTimeout(timeout);

    // Mapeamento seguro dos campos
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

    // Filtro dos ativos
    const ativos = pontos.filter(
      (p) => p.status && p.status.toLowerCase() === "ativo"
    );

    console.log(`📦 Pontos carregados: ${ativos.length} ativos.`);

    return res.status(200).json({
      sucesso: true,
      total: ativos.length,
      pontos: ativos,
    });
  } catch (erro) {
    console.error("❌ Erro na rota /api/pontosdecoleta:", erro);

    // Mensagem diferenciada se for timeout
    const isTimeout = erro.name === "AbortError";
    const mensagem = isTimeout
      ? "Tempo de resposta excedido. Tente novamente em alguns segundos."
      : "Erro ao buscar pontos de coleta.";

    res.status(500).json({
      sucesso: false,
      mensagem,
      detalhes: erro.message,
    });
  }
}
