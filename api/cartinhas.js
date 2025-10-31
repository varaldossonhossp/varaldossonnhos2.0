// ============================================================
// VARAL DOS SONHOS — API: Cartinhas
// ------------------------------------------------------------
// • Responsável por buscar as cartinhas disponíveis no Airtable.
// • Retorna somente as que possuem status "disponivel".
// • Fornece dados estruturados para o front-end (Varal Virtual)
//   e para a integração com .NET MAUI, mantendo consistência.
// ------------------------------------------------------------
// Dependências:
//   - Airtable SDK
// ------------------------------------------------------------
// Compatibilidade:
//   - Hospedagem: Vercel (Node.js runtime)
//   - Banco de dados: Airtable (API Key e Base ID via variáveis de ambiente)
//   - Consumo: Front-end JS (fetch /api/cartinhas) e .NET MAUI (HttpClient)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ============================================================
  // 🔹 Configurações iniciais e headers CORS
  // ------------------------------------------------------------
  // Permite acesso seguro via front-end e mobile (.NET MAUI)
  // ============================================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ============================================================
    // 🔹 Conexão com a base do Airtable
    // ------------------------------------------------------------
    // Autentica a conexão com as variáveis definidas no .env.local:
    //   • AIRTABLE_API_KEY
    //   • AIRTABLE_BASE_ID
    //   • AIRTABLE_CARTINHAS_TABLE 
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const table = process.env.AIRTABLE_CARTINHAS_TABLE || "cartinha";

    // ============================================================
    // 🔹 Consulta os registros da tabela "cartinha"
    // ------------------------------------------------------------
    // Filtro: retorna apenas cartinhas com status = 'disponivel'
    // Ordenação: por data de cadastro (mais recentes primeiro)
    // ============================================================
    const records = await base(table)
      .select({
        filterByFormula: "{status}='disponivel'",
        sort: [{ field: "data_cadastro", direction: "desc" }],
      })
      .all();

    // ============================================================
    // 🔹 Mapeamento dos registros retornados
    // ------------------------------------------------------------
    // Cada registro é convertido em um objeto JSON legível,
    // contendo todos os campos necessários para o front-end.
    // ============================================================
    const cartinhas = records.map((r) => ({
      id: r.id,
      ...r.fields,
    }));

    // ============================================================
    // 🔹 Resposta de sucesso (JSON)
    // ------------------------------------------------------------
    // Retorna as cartinhas disponíveis para adoção.
    // Formato compatível com front e app .NET MAUI.
    // ============================================================
    res.status(200).json({
      sucesso: true,
      total: cartinhas.length,
      cartinhas,
    });

  } catch (e) {
    // ============================================================
    // 🔹 Tratamento de erro
    // ------------------------------------------------------------
    // Em caso de falha de comunicação ou configuração incorreta,
    // retorna erro HTTP 500 com mensagem descritiva.
    // ============================================================
    console.error("Erro /api/cartinhas:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar cartinhas. Verifique o nome da tabela e campos.",
      detalhe: e.message,
    });
  }
}
