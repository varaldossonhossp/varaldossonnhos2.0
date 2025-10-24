import Airtable from "airtable";
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("galeria").select({
      filterByFormula: "{exibir_home}=TRUE()",
    }).all();

    const imagens = records.map(r => ({
      id: r.id,
      imagem_url: r.fields.imagem ? r.fields.imagem[0].url : null,
      legenda: r.fields.legenda || "",
    }));

    res.status(200).json(imagens);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar galeria" });
  }
}
