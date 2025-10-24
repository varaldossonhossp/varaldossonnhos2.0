import Airtable from "airtable";
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("gamificacao").select().all();
    const ranking = records.map(r => ({
      nome: r.fields.nome,
      pontos: r.fields.pontos,
      nivel: r.fields.nivel,
      medalhas: r.fields.medalhas,
    })).sort((a,b)=>b.pontos - a.pontos);

    res.status(200).json(ranking);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar ranking" });
  }
}
