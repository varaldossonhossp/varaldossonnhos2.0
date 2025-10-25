// ============================================================
// 💌 VARAL DOS SONHOS — /api/cartinhas.js
// ------------------------------------------------------------
// Endpoint que retorna as cartinhas do Airtable.
// Mostra status (Disponível / Adotada) e os dados principais.
// ============================================================

import Airtable from "airtable";

// ============================================================
// 🔐 Conexão com o Airtable (usa variáveis .env.local)
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// ============================================================
// ⚙️ Função principal do endpoint /api/cartinhas
// ============================================================
export default async function handler(req, res) {
  try {
    // Lê todos os registros da tabela "cartinhas"
    const records = await base("cartinhas").select({}).all();

    // Formata cada registro em um objeto limpo
    const cartinhas = records.map((r) => ({
      id: r.id,
      nome_crianca: r.fields.nome_crianca || "Sem nome",
      idade: r.fields.idade || "",
      carta: r.fields.carta || "",
      imagem: Array.isArray(r.fields.imagem)
        ? r.fields.imagem[0]?.url
        : null,
      status: r.fields.status || "Disponível", // "Disponível" ou "Adotada"
      ponto_coleta: r.fields.ponto_coleta || "",
      data_criacao: r.fields.data_criacao || "",
    }));

    // Retorna JSON com sucesso
    res.status(200).json({ sucesso: true, total: cartinhas.length, cartinhas });
  } catch (erro) {
    console.error("Erro ao buscar cartinhas:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar à tabela de cartinhas.",
      detalhe: erro.message,
    });
  }
}
