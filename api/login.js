// ============================================================
// 💙 VARAL DOS SONHOS — /api/login.js
// ------------------------------------------------------------
// Autentica usuário pelo e-mail e senha.
// Tabela: “usuarios”
// ------------------------------------------------------------
//   • Campos: email_usuario, senha, nome_usuario, tipo_usuario
// ============================================================

import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não permitido" });
  }

  const { email_usuario, senha } = req.body;

  if (!email_usuario || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    const records = await base("usuarios")
      .select({
        filterByFormula: `{email_usuario}='${email_usuario}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
    }

    const user = records[0].fields;

    if (user.senha !== senha) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Senha incorreta.",
      });
    }

    if (user.status !== "ativo") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Usuário inativo. Contate o suporte.",
      });
    }

    res.status(200).json({
      sucesso: true,
      usuario: {
        nome_usuario: user.nome_usuario,
        tipo_usuario: user.tipo_usuario,
        email_usuario: user.email_usuario,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({
      sucesso: false,
      erro: "Erro interno ao autenticar usuário.",
    });
  }
}
