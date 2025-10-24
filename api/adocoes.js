import Airtable from "airtable";
import emailjs from "@emailjs/browser";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Método não permitido");
  
  const { id_cartinha, id_usuario, ponto_coleta, email } = req.body;

  try {
    await base("adocoes").create([
      {
        fields: {
          cartinha: [id_cartinha],
          usuario: [id_usuario],
          ponto_coleta,
          status: "Aguardando Confirmação",
        },
      },
    ]);

    await base("cartinhas").update([
      { id: id_cartinha, fields: { status: "Aguardando Confirmação", adotada: true } },
    ]);

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        assunto: "Adoção registrada 💙",
        mensagem: "Sua adoção foi registrada com sucesso e aguarda confirmação do administrador!",
      },
      process.env.EMAILJS_PUBLIC_KEY
    );

    res.status(200).json({ sucesso: true });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao registrar adoção", detalhes: error.message });
  }
}
