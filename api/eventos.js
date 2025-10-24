// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js
// ============================================================

import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("eventos").select({}).all();

    const eventos = records
      .map((r) => ({
        id: r.id,
        titulo: r.fields.titulo || "Evento sem título",
        descricao: r.fields.descricao || "",
        data_evento: r.fields.data_evento || "",
        imagens: (r.fields.imagem || []).map((img) => img.url),
        ativo: r.fields.ativo === true
      }))
      .filter((e) => e.ativo);

    res.status(200).json({ sucesso: true, eventos });
  } catch (erro) {
    console.error("Erro ao buscar eventos:", erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
}
