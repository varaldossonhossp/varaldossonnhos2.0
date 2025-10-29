// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (Vercel Backend)
// ------------------------------------------------------------
// Cadastro e login de usuários (doador, voluntário, admin).
// Compatível com senhas antigas (texto puro) e novas (bcrypt).
// ============================================================

import Airtable from "airtable";
import bcrypt from "bcryptjs";

export const config = { runtime: "nodejs" };

// Função auxiliar para resposta de erro padronizada
const err = (res, code, msg) =>
  res.status(code).json({ sucesso: false, mensagem: msg });

export default async function handler(req, res) {
  // 🔒 CORS (Cross-Origin Resource Sharing)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
  const table = process.env.AIRTABLE_USUARIOS_TABLE || "usuario";

  try {
    // ============================================================
    // 📝 CADASTRO (POST)
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
        return err(res, 400, "E-mail e senha são obrigatórios para o cadastro.");

      // 1️⃣ Verifica se já existe o e-mail
      const existing = await base(table)
        .select({
          filterByFormula: `LOWER({email_usuario}) = '${email_usuario.toLowerCase()}'`,
        })
        .all();

      if (existing.length > 0)
        return err(res, 409, "Este e-mail já está cadastrado. Tente fazer login.");

      // 2️⃣ Criptografa a senha (bcrypt)
      const hash = await bcrypt.hash(senha, 8);

      // 3️⃣ Cria o novo registro no Airtable
      const novo = await base(table).create([
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
    // 🔑 LOGIN (GET)
    // ============================================================
    if (req.method === "GET") {
      const { email, senha } = req.query;

      if (!email || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para o login.");

      const records = await base(table)
        .select({
          filterByFormula: `AND(LOWER({email_usuario})='${email.toLowerCase()}', {status}='ativo')`,
        })
        .all();

      if (records.length === 0)
        return err(res, 401, "Usuário não encontrado ou inativo.");

      const user = records[0].fields;

      // ============================================================
      // 🧠 COMPARAÇÃO HÍBRIDA DE SENHAS
      // ============================================================
      let match = false;

      try {
        // tenta comparar com hash bcrypt (senhas novas)
        match = await bcrypt.compare(senha, user.senha || "");
      } catch (e) {
        // se falhar, faz comparação direta (senhas antigas em texto puro)
        match = senha === (user.senha || "");
      }

      if (!match)
        return err(res, 401, "Senha incorreta. Verifique seus dados e tente novamente.");

      // Remove o campo 'senha' antes de enviar ao front
      const { senha: _, ...usuarioDados } = user;

      return res.status(200).json({
        sucesso: true,
        usuario: usuarioDados,
        id_usuario: records[0].id,
      });
    }

    // ============================================================
    // 🚫 MÉTODO NÃO SUPORTADO
    // ============================================================
    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro /api/usuarios:", e);
    return err(
      res,
      500,
      "Erro interno do servidor ao processar sua solicitação: " + e.message
    );
  }
}
