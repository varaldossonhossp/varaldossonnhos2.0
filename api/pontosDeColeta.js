import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("pontos_coleta").select().all();
    const pontos = records.map(r => ({
      id: r.id,
      nome: r.fields.nome,
      endereco: r.fields.endereco,
      horario: r.fields.horario,
      mapa: r.fields.mapa || "",
    }));
    res.status(200).json(pontos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar pontos de coleta" });
  }
}
