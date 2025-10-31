// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão 100% compatível)
// ------------------------------------------------------------
// API Serverless (Vercel) para Cadastro e Login de usuários.
// Corrigido: erro "res.status is not a function" no ambiente ESM.
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// ============================================================
// 🔐 Variáveis de ambiente
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_USUARIO_TABLE || "usuario";

// ============================================================
// 🧰 Funções utilitárias
// ============================================================
function sendJson(res, code, data) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function ok(res, data) {
  sendJson(res, 200, data);
}

function err(res, code, msg, extra = {}) {
  console.error("❌", code, msg, extra);
  sendJson(res, code, { sucesso: false, mensagem: msg, ...extra });
}

const escapeFormulaString = (s) => (s ? s.replace(/'/g, "''") : "");

// ============================================================
// 🧩 Handler principal
// ============================================================
export default async function handler(req, res) {
  try {
    // ------------------------------------------------------------
    // Cabeçalhos CORS
    // ------------------------------------------------------------
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return err(res, 500, "Variáveis Airtable ausentes.");
    }

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // ============================================================
    // POST → LOGIN e CADASTRO
    // ============================================================
    if (req.method === "POST") {
      const body = await getRequestBody(req);
      const { acao } = body || {};

      // --------------------- CADASTRO ---------------------
      if (acao === "cadastro") {
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
        } = body || {};

        if (!nome_usuario || !email_usuario || !senha)
          return err(res, 400, "Campos obrigatórios ausentes.");

        // Verifica se e-mail já existe
        const existe = await base(TABLE_NAME)
          .select({
            filterByFormula: `{email_usuario}='${escapeFormulaString(email_usuario)}'`,
            maxRecords: 1,
          })
          .all();

        if (existe.length > 0)
          return err(res, 409, "E-mail já cadastrado.");

        const novo = await base(TABLE_NAME).create([
          {
            fields: {
              nome_usuario,
              email_usuario,
              telefone,
              senha,
              tipo_usuario: tipo_usuario || "doador",
              cidade,
              cep,
              endereco,
              numero,
              status: "ativo",
            },
          },
        ]);

        return ok(res, {
          sucesso: true,
          mensagem: "Usuário cadastrado com sucesso.",
          id_usuario: novo[0].id,
        });
      }

      // ----------------------- LOGIN ----------------------
      if (acao === "login") {
        const { email_usuario, senha } = body || {};
        if (!email_usuario || !senha)
          return err(res, 400, "E-mail e senha obrigatórios.");

        const emailEsc = escapeFormulaString(email_usuario);
        const senhaEsc = escapeFormulaString(senha);

        const formula = `AND({email_usuario}='${emailEsc}', {senha}='${senhaEsc}', {status}='ativo')`;
        console.log("🧩 Login formula:", formula, "tabela:", TABLE_NAME);

        const registros = await base(TABLE_NAME)
          .select({ filterByFormula: formula, maxRecords: 1 })
          .all();

        if (!registros || registros.length === 0)
          return err(res, 401, "Credenciais inválidas.");

        const user = registros[0].fields;
        const { senha: _, ...dados } = user;

        return ok(res, {
          sucesso: true,
          mensagem: "Login efetuado com sucesso.",
          usuario: dados,
          id_usuario: registros[0].id,
        });
      }

      // Ação inválida
      return err(res, 400, "Ação inválida. Use 'login' ou 'cadastro'.");
    }

    // ============================================================
    // GET → Retorna lista (teste)
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(TABLE_NAME)
        .select({ maxRecords: 5 })
        .all();
      const usuarios = registros.map((r) => ({
        id: r.id,
        ...r.fields,
      }));
      return ok(res, { sucesso: true, usuarios });
    }

    // ============================================================
    // Método não suportado
    // ============================================================
    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}

// ============================================================
// 🧩 Leitura segura do corpo da requisição (req.body em ESM)
// ============================================================
async function getRequestBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = Buffer.concat(chunks).toString();
    return JSON.parse(data || "{}");
  } catch (err) {
    console.error("⚠️ Erro ao ler body:", err);
    return {};
  }
}
