import Airtable from "airtable";
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Método não permitido");
  const { nome, endereco, telefone, email, tipo } = req.body;

  try {
    await base("usuarios").create([
      { fields: { nome, endereco, telefone, email, tipo } }
    ]);
    res.status(200).json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
}
