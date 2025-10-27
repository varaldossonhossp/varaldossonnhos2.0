// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js
// ------------------------------------------------------------
// Cadastro e login de usuários (doador, voluntário, admin).
// Campos: nome_usuario, email_usuario, telefone, senha, tipo_usuario, status
// ============================================================

import Airtable from "airtable";
import bcrypt from "bcryptjs"; // opcional, segurança local

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
  const table = process.env.AIRTABLE_USUARIOS_TABLE || "usuarios";

  try {
    // 🔐 Cadastro
    if (req.method === "POST") {
      const { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade } = req.body || {};
      if (!email_usuario || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: "E-mail e senha obrigatórios." });
      }

      const hash = await bcrypt.hash(senha, 8);
      const novo = await base(table).create([
        {
          fields: {
            nome_usuario,
            email_usuario,
            telefone,
            senha: hash,
            tipo_usuario: tipo_usuario || "doador",
            cidade,
            status: "ativo",
          },
        },
      ]);

      return res.status(200).json({ sucesso: true, id: novo[0].id });
    }

    // 🔑 Login
    if (req.method === "GET") {
      const { email, senha } = req.query;
      if (!email || !senha)
        return res.status(400).json({ sucesso: false, mensagem: "Email e senha são obrigatórios." });

      const records = await base(table)
        .select({
          filterByFormula: `AND({email_usuario}='${email}', {status}='ativo')`,
        })
        .all();

      if (records.length === 0)
        return res.status(401).json({ sucesso: false, mensagem: "Usuário não encontrado." });

      const user = records[0].fields;
      const match = await bcrypt.compare(senha, user.senha || "");

      if (!match)
        return res.status(401).json({ sucesso: false, mensagem: "Senha incorreta." });

      return res.status(200).json({ sucesso: true, usuario: user });
    }

    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  } catch (e) {
    console.error("Erro /api/usuarios:", e);
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}
