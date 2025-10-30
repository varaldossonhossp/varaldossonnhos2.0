// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão estável sem 500)
// ------------------------------------------------------------
// Login híbrido (texto puro ou bcrypt) e cadastro com validação.
// ============================================================

import Airtable from "airtable";
import bcryptjs from "bcryptjs"; // usar nome completo evita conflito no Vercel

export const config = { runtime: "nodejs" };
const TABLE_NAME = process.env.AIRTABLE_USUARIOS_TABLE || "usuario";

const err = (res, code, msg, extra = {}) =>
  res.status(code).json({ sucesso: false, mensagem: msg, ...extra });

export default async function handler(req, res) {
  // Permitir chamadas de qualquer origem (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // ============================================================
    // 📝 CADASTRO
    // ============================================================
    if (req.method === "POST") {
      const {
        nome_usuario,
        email_usuario,
        telefone,
        senha,
        tipo_usuario,
        cidade,
        cep,
        endereco,
        numero,
      } = req.body || {};

      if (!email_usuario || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios.");

      // Checar duplicidade de e-mail e telefone
      const formula = `
        OR(
          LOWER({email_usuario})='${email_usuario.toLowerCase()}',
          REGEX_REPLACE({telefone}, "\\\\D", "")='${(telefone || "").replace(/\D/g, "")}'
        )
      `;
      const existentes = await base(TABLE_NAME).select({ filterByFormula: formula }).all();

      if (existentes.length > 0)
        return err(res, 409, "Já existe cadastro com este e-mail ou telefone.");

      // Criptografa nova senha
      const hash = await bcryptjs.hash(senha, 8);

      const novo = await base(TABLE_NAME).create([
        {
          fields: {
            nome_usuario,
            email_usuario,
            telefone,
            senha: hash,
            tipo_usuario: tipo_usuario || "doador",
            cidade,
            cep,
            endereco,
            numero,
            status: "ativo",
          },
        },
      ]);

      return res.status(201).json({
        sucesso: true,
        mensagem: "Usuário cadastrado com sucesso.",
        id_usuario: novo[0].id,
      });
    }

    // ============================================================
    // 🔑 LOGIN
    // ============================================================
    if (req.method === "GET") {
      const { email, senha } = req.query || {};
      if (!email || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para login.");

      // Busca usuário ativo
      const records = await base(TABLE_NAME)
        .select({
          filterByFormula: `AND(LOWER({email_usuario})='${email.toLowerCase()}', {status}='ativo')`,
        })
        .all();

      if (records.length === 0)
        return err(res, 401, "Usuário não encontrado ou inativo.");

      const user = records[0].fields;

      if (!user.senha)
        return err(res, 400, "Usuário sem senha cadastrada no banco de dados.");

      // Comparação híbrida
      let match = false;
      try {
        match = await bcryptjs.compare(senha, user.senha);
      } catch (e) {
        match = senha === user.senha;
      }

      if (!match)
        return err(res, 401, "Senha incorreta. Tente novamente.");

      // Remove senha antes de retornar
      const { senha: _, ...dados } = user;

      return res.status(200).json({
        sucesso: true,
        usuario: dados,
        id_usuario: records[0].id,
      });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro /api/usuarios:", e);
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}
