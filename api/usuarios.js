// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão segura e compatível)
// ------------------------------------------------------------
// Suporte para login com senha texto puro e criptografada.
// Evita travamento no Vercel.
// ============================================================

import Airtable from "airtable";

let bcryptjs = null;
try {
  bcryptjs = await import("bcryptjs");
} catch {
  console.warn("⚠️ bcryptjs não carregado. Fallback ativado (modo texto simples).");
}

export const config = { runtime: "nodejs" };
const TABLE_NAME = process.env.AIRTABLE_USUARIOS_TABLE || "usuario";

const err = (res, code, msg, extra = {}) =>
  res.status(code).json({ sucesso: false, mensagem: msg, ...extra });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 📩 CADASTRO (POST)
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

      // Verifica duplicidade (e-mail ou telefone)
      const formula = `
        OR(
          LOWER({email_usuario})='${email_usuario.toLowerCase()}',
          REGEX_REPLACE({telefone}, "\\\\D", "")='${(telefone || "").replace(/\D/g, "")}'
        )
      `;
      const existentes = await base(TABLE_NAME)
        .select({ filterByFormula: formula })
        .all();

      if (existentes.length > 0)
        return err(res, 409, "Já existe cadastro com este e-mail ou telefone.");

      // Criptografa (se possível)
      let senhaFinal = senha;
      if (bcryptjs) {
        try {
          senhaFinal = await bcryptjs.hash(senha, 8);
        } catch {
          senhaFinal = senha;
        }
      }

      const novo = await base(TABLE_NAME).create([
        {
          fields: {
            nome_usuario,
            email_usuario,
            telefone,
            senha: senhaFinal,
            tipo_usuario: tipo_usuario || "doador",
            cidade,
            cep,
            endereco,
            numero,
            status: "ativo",
            data_cadastro: new Date().toISOString().split("T")[0],
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
      const { email, senha } = req.query || {};
      if (!email || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para login.");

      const registros = await base(TABLE_NAME)
        .select({
          filterByFormula: `AND(LOWER({email_usuario})='${email.toLowerCase()}', {status}='ativo')`,
        })
        .all();

      if (registros.length === 0)
        return err(res, 401, "Usuário não encontrado ou inativo.");

      const user = registros[0].fields;
      if (!user.senha)
        return err(res, 400, "Usuário sem senha no banco de dados.");

      // Verificação híbrida
      let match = false;
      try {
        if (bcryptjs) match = await bcryptjs.compare(senha, user.senha);
      } catch {
        match = false;
      }
      if (!match && senha === user.senha) match = true;

      if (!match)
        return err(res, 401, "Senha incorreta. Tente novamente.");

      const { senha: _, ...dados } = user;

      return res.status(200).json({
        sucesso: true,
        usuario: dados,
        id_usuario: registros[0].id,
      });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    return err(res, 500, "Erro interno do servidor.", { detalhe: e.message });
  }
}
