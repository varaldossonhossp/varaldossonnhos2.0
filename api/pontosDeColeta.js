// ============================================================
// 💙 VARAL DOS SONHOS — /api/pontosdecoleta.js
// ------------------------------------------------------------
// Retorna lista de pontos de coleta do Airtable
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ sucesso: false, erro: "Método não permitido" });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );

    const tabela = process.env.AIRTABLE_PONTOCOLETA_TABLE || "pontos_coleta";
    const registros = await base(tabela).select().all();

    const pontos = registros.map((r) => ({
      id_ponto: r.fields["id ponto"] || "",
      nome_ponto: r.fields["nome ponto"] || "",
      endereco: r.fields["endereco"] || "",
      telefone: r.fields["telefone"] || "",
      email_ponto: r.fields["email_ponto"] || "",
      horario: r.fields["horario"] || "",
      responsavel: r.fields["responsavel"] || "",
      status: r.fields["status"] || "",
      data_cadastro: r.fields["data_cadastro"] || "",
      adocoes: r.fields["adocoes"] || "",
      adocoes2: r.fields["adocoes2"] || ""
    }));

    res.status(200).json({ sucesso: true, pontos });
  } catch (erro) {
    console.error("Erro ao buscar pontos:", erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
}
