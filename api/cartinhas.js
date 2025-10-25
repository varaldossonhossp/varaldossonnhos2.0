console.log("🔍 Verificando variáveis de ambiente...");
console.log("API_KEY:", process.env.AIRTABLE_API_KEY ? "OK" : "MISSING");
console.log("BASE_ID:", process.env.AIRTABLE_BASE_ID ? "OK" : "MISSING");
console.log("ADMIN_SECRET:", process.env.ADMIN_SECRET ? "OK" : "MISSING");





// ============================================================
// 💌 VARAL DOS SONHOS — /api/cartinhas.js
// ------------------------------------------------------------
// Retorna todas as cartinhas ativas da tabela "cartinhas"
// (campos: nome_crianca, idade, sexo, sonho, irmaos, foto[], status, ativo)
// ============================================================

import Airtable from "airtable";

// 🔐 Conexão com o Airtable (usa variáveis do .env.local)
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    // Seleciona apenas cartinhas ativas
    const records = await base("cartinhas")
      .select({
        filterByFormula: "ativo = 1",
        sort: [{ field: "nome_crianca", direction: "asc" }],
      })
      .all();

    // Mapeia campos existentes
    const cartinhas = records.map((r) => ({
      id: r.id,
      nome_crianca: r.fields.nome_crianca || "Sem nome",
      idade: r.fields.idade || "",
      sexo: r.fields.sexo || "",
      irmaos: r.fields.irmaos || "",
      sonho: r.fields.sonho || "",
      foto: Array.isArray(r.fields.foto) ? r.fields.foto[0]?.url : "/imagens/sem-foto.png",
      status: r.fields.status || "Disponível",
      adotada: r.fields.adotada || false,
    }));

    res.status(200).json({ sucesso: true, total: cartinhas.length, cartinhas });
  } catch (erro) {
    console.error("❌ Erro ao buscar cartinhas:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar à tabela de cartinhas.",
      detalhe: erro.message,
    });
  }
}
