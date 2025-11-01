// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (versão final revisada)
// ------------------------------------------------------------
// • Busca todas as cartinhas disponíveis no Airtable.
// • Retorna somente status = 'disponivel'.
// • Inclui sempre o campo id_cartinha (autonumber) e o recordId.
// • Compatível com front JS e app .NET MAUI.
// ------------------------------------------------------------
// Hospedagem: Vercel (Node.js runtime)
// Banco: Airtable
// Dependências: airtable (npm)
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ============================================================
  // 🔹 Configurações iniciais e headers CORS
  // ============================================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ============================================================
    // 🔹 Conexão com o Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const table = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

    // ============================================================
    // 🔹 Consulta: apenas cartinhas disponíveis
    // ============================================================
    const records = await base(table)
      .select({
        filterByFormula: "{status}='disponivel'",
        sort: [{ field: "data_cadastro", direction: "desc" }],
      })
      .all();

    // ============================================================
    // 🔹 Mapeamento e normalização dos registros
    // ------------------------------------------------------------
    // Inclui:
    //   • id (recordId)
    //   • id_cartinha (autonumber)
    //   • todos os campos textuais
    // ============================================================
    const cartinha = records.map((r) => ({
      id: r.id, // recordId do Airtable
      id_cartinha: r.fields.id_cartinha ?? null, // autonumber garantido
      nome_crianca: r.fields.nome_crianca || "",
      primeiro_nome: r.fields.primeiro_nome || "",
      sexo: r.fields.sexo || "",
      idade: r.fields.idade || "",
      sonho: r.fields.sonho || "",
      escola: r.fields.escola || "",
      cidade: r.fields.cidade || "",
      psicologa_responsavel: r.fields.psicologa_responsavel || "",
      telefone_contato: r.fields.telefone_contato || "",
      imagem_cartinha: r.fields.imagem_cartinha || [],
      irmaos: r.fields.irmaos || "",
      idade_irmaos: r.fields.idade_irmaos || "",
      status: r.fields.status || "",
      data_cadastro: r.fields.data_cadastro || "",
    }));

    // ============================================================
    // 🔹 Resposta JSON padronizada
    // ============================================================
    res.status(200).json({
      sucesso: true,
      total: cartinha.length,
      cartinha,
    });
  } catch (e) {
    // ============================================================
    // 🔹 Tratamento de erro
    // ============================================================
    console.error("🔥 Erro /api/cartinha:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar cartinhas. Verifique o nome da tabela e campos.",
      detalhe: e.message,
    });
  }
}
