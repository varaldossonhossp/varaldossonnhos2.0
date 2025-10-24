import Airtable from "airtable";
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Método não permitido");
  const { email } = req.body;
  try {
    const records = await base("usuarios").select({
      filterByFormula: `{email}='${email}'`
    }).firstPage();

    if (records.length > 0) {
      const user = records[0].fields;
      res.status(200).json({ sucesso: true, usuario: user });
    } else {
      res.status(401).json({ sucesso: false, mensagem: "Usuário não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao autenticar" });
  }
}
