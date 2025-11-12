// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js
// ------------------------------------------------------------
// Retorna todas as adoções registradas com dados resumidos
// para o painel administrativo de logística.
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  try {
    const records = await base("ADOÇÕES").select({
      fields: [
        "id_adocao",
        "cartinha",
        "nome_usuario",
        "email_usuario",
        "ponto_coleta",
        "data_limite_recebimento",
        "status_adocao"
      ],
      sort: [{ field: "id_adocao", direction: "asc" }]
    }).all();

    const adocoes = records.map(r => ({
      id: r.get("id_adocao"),
      cartinha: r.get("cartinha") || "—",
      nome_usuario: r.get("nome_usuario") || "—",
      email_usuario: r.get("email_usuario") || "—",
      ponto_coleta: r.get("ponto_coleta") || "—",
      data_limite_recebimento: r.get("data_limite_recebimento") || "—",
      status: r.get("status_adocao") || "aguardando confirmacao"
    }));

    return res.status(200).json(adocoes);

  } catch (err) {
    console.error("Erro ao listar adoções:", err);
    return res.status(500).json({ success: false, message: "Erro interno no servidor" });
  }
}
