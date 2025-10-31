// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão TCC)
// ------------------------------------------------------------
// Backend serverless (Vercel) para Cadastro e Login.
// Tabela Airtable: "usuario"
// Campos: nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero, status
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// ============================================================
// 🔐 Configurações de ambiente (definidas no painel Vercel)
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_USUARIO_TABLE || "usuario";

// ============================================================
// 🧰 Funções utilitárias
// ============================================================
const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

const escapeFormulaString = (str) => str ? str.replace(/'/g, "''") : "";

// ============================================================
// 🧩 FUNÇÃO PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID)
      return err(res, 500, "Chaves Airtable ausentes.");

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // ============================================================
    // POST → CADASTRO DE USUÁRIO
    // ============================================================
    if (req.method === "POST") {
      const {
        nome_usuario, email_usuario, telefone, senha,
        tipo_usuario, cidade, cep, endereco, numero
      } = req.body || {};

      if (!nome_usuario || !email_usuario || !senha)
        return err(res, 400, "Campos obrigatórios ausentes.");

      const novo = await base(TABLE_NAME).create([{
        fields: {
          nome_usuario, email_usuario, telefone,
          senha, tipo_usuario, cidade, cep, endereco, numero,
          status: "ativo"
        }
      }]);

      return res.status(201).json({
        sucesso: true,
        mensagem: "Usuário cadastrado com sucesso.",
        id_usuario: novo[0].id
      });
    }

    // ============================================================
    // GET → LOGIN DO USUÁRIO
    // ============================================================
    if (req.method === "GET") {
      const { email, senha } = req.query || {};
      if (!email || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios.");

      const emailEsc = escapeFormulaString(email);
      const senhaEsc = escapeFormulaString(senha);

      const formula = `AND({email_usuario}='${emailEsc}', {senha}='${senhaEsc}', {status}='ativo')`;
      const registros = await base(TABLE_NAME).select({ filterByFormula: formula, maxRecords: 1 }).all();

      if (!registros.length) return err(res, 401, "Credenciais inválidas.");

      const user = registros[0].fields;
      const { senha: _, ...dados } = user;
      return res.status(200).json({
        sucesso: true,
        mensagem: "Login efetuado com sucesso.",
        usuario: dados,
        id_usuario: registros[0].id
      });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}
