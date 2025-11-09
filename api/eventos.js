// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js (versão corrigida TCC)
// ------------------------------------------------------------
// 🔹 Compatível com Airtable e Vercel
// 🔹 Corrige erro "filterByFormula should be a string"
// 🔹 Suporta ?tipo=home | ?tipo=admin | ?tipo=all
// 🔹 Retorna todos os campos da tabela "eventos"
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";

    const { tipo } = req.query;

    // 📌 Definição do filtro
    let filtro = "";
    if (tipo === "home") {
      filtro = "AND({destacar_na_homepage}=1, {status_evento}='em andamento')";
    } else if (tipo === "admin") {
      filtro = "{status_evento}='em andamento'";
    }

    // 📌 Configuração de seleção segura
    const selectConfig = {
      sort: [{ field: "data_evento", direction: "asc" }],
    };
    if (filtro && filtro.trim() !== "") {
      selectConfig.filterByFormula = filtro;
    }

    const records = await base(table).select(selectConfig).all();

    const eventos = records.map((r) => ({
      id: r.id,
      nome_evento: r.fields.nome_evento || "",
      descricao: r.fields.descricao || "",
      local_evento: r.fields.local_evento || "",
      data_evento: r.fields.data_evento || "",
      data_limite_recebimento: r.fields.data_limite_recebimento || "",
      imagem: r.fields.imagem || [],
      status_evento: r.fields.status_evento || "",
      destacar_na_homepage: r.fields.destacar_na_homepage || false,
    }));

    res.status(200).json({ sucesso: true, eventos });
  } catch (e) {
    console.error("🔥 Erro /api/eventos:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar eventos.",
      detalhe: e.message,
    });
  }
}
