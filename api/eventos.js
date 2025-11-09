// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js (versão TCC final)
// ------------------------------------------------------------
// 🔹 Mantém compatibilidade com o carrossel da home pública
// 🔹 Acrescenta suporte ao painel admin (Gerenciar Cartinhas)
// 🔹 Permite listar todos os eventos ou apenas "em andamento"
// 🔹 Retorna todos os campos principais da tabela "eventos"
// ------------------------------------------------------------
// Campos utilizados:
//  id_evento (autonumber), nome_evento, descricao, local_evento,
//  data_evento, data_limite_recebimento, imagem,
//  status_evento ("em andamento", "encerrado", "proximo"),
//  destacar_na_homepage (checkbox)
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
    // 📌 tipo=home → apenas eventos destacados
    // 📌 tipo=admin → eventos "em andamento"
    // 📌 tipo=all   → todos os eventos

    let filtro = "";
    if (tipo === "home") {
      filtro = "AND({destacar_na_homepage}=1, {status_evento}='em andamento')";
    } else if (tipo === "admin") {
      filtro = "{status_evento}='em andamento'";
    }

    const records = await base(table)
      .select({
        filterByFormula: filtro || undefined,
        sort: [{ field: "data_evento", direction: "asc" }],
      })
      .all();

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
