import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base("cartinhas").select({ view: "Grid view" }).all();

    const cartinhas = records.map(r => {
      const fotos = r.fields.foto || r.fields.fotos || [];
      return {
        id: r.id,
        nome_crianca: r.fields.nome_crianca || "",
        idade: r.fields.idade || "",
        sexo: r.fields.sexo || "",
        sonho: r.fields.sonho || "",
        irmaos: r.fields.irmaos || "",
        status: r.fields.status || "Disponível",
        adotada: !!r.fields.adotada,
        ativo: !!r.fields.ativo,
        foto_url: fotos.length > 0 ? fotos[0].url : "/imagens/cartinha-default.png",
      };
    });

    res.status(200).json(cartinhas);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao carregar cartinhas", detalhe: error.message });
  }
}
