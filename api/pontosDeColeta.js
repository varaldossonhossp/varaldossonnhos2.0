// ============================================================
// 💙 VARAL DOS SONHOS — /api/pontosdecoleta.js
// Endpoint: GET /api/pontosdecoleta
// Retorna todos os pontos ativos do Airtable
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const records = await base("pontos_coleta").select({}).all();

      const pontos = records
        .filter(r => r.fields.status === "ativo")
        .map(r => ({
          id: r.id,
          nome_ponto: r.fields.nome_ponto || "",
          endereco: r.fields.endereco || "",
          telefone: r.fields.telefone || "",
          email_ponto: r.fields.email_ponto || "",
          horario: r.fields.horario || "",
          responsavel: r.fields.responsavel || "",
        }));

      res.status(200).json({ sucesso: true, pontos });
    } catch (erro) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  } else {
    res.status(405).json({ sucesso: false, erro: "Método não permitido" });
  }
}
