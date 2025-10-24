import Airtable from "airtable";
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("eventos").select().all();
    const eventos = records.map(r => ({
      id: r.id,
      nome: r.fields.nome,
      data: r.fields.data,
      local: r.fields.local,
      descricao: r.fields.descricao,
      imagem: r.fields.imagem ? r.fields.imagem[0].url : null,
    }));
    res.status(200).json(eventos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar eventos" });
  }
}
