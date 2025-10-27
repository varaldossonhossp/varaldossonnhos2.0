// ============================================================
// 💙 VARAL DOS SONHOS — /api/cadastro.js
// ------------------------------------------------------------
// Cadastra um novo usuário na tabela “usuarios” do Airtable
// Espera via POST:
// { nome_usuario, cep, endereco, numero, cidade, email_usuario,
//   telefone, tipo_usuario, senha }
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não permitido" });
  }

  try {
    const {
      nome_usuario,
      cep,
      endereco,
      numero,
      cidade,
      email_usuario,
      telefone,
      tipo_usuario,
      senha,
    } = req.body;

    if (!nome_usuario || !email_usuario || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios ausentes (nome, e-mail, senha).",
      });
    }

    await base("usuarios").create([
      {
        fields: {
          nome_usuario,
          cep: cep || "",
          endereco: endereco || "",
          numero: numero || "",
          cidade: cidade || "",
          email_usuario,
          telefone: telefone || "",
          tipo_usuario: tipo_usuario || "doador",
          senha,
          status: "ativo",
          data_cadastro: new Date().toISOString(),
        },
      },
    ]);

    res.status(200).json({
      sucesso: true,
      mensagem: "Usuário cadastrado com sucesso 💙",
    });
  } catch (erro) {
    console.error("Erro ao cadastrar usuário:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao cadastrar usuário.",
      erro: erro.message,
    });
  }
}
