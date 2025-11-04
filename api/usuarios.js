// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão funcional final)
// ------------------------------------------------------------
// Rotas:
//   • POST /api/usuarios   → acao: "cadastro" ou "login"
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// ============================================================
// 🔐 Configurações
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_USUARIO_TABLE || "usuario";

// ============================================================
// 🧰 Utilitários de resposta (compatível Node 20 / Vercel)
// ============================================================
function sendJson(res, code, data) {
  res.statusCode = code;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function err(res, code, msg, extra = {}) {
  console.error("❌", code, msg, extra);
  sendJson(res, code, { sucesso: false, mensagem: msg, ...extra });
}

function ok(res, data) {
  sendJson(res, 200, { sucesso: true, ...data });
}

const escapeFormulaString = (str) => (str ? str.replace(/'/g, "''") : "");

// ============================================================
// 🔧 Função auxiliar para ler corpo JSON (req.body)
// ============================================================
async function getBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = Buffer.concat(chunks).toString();
    return JSON.parse(data || "{}");
  } catch (e) {
    console.error("⚠️ Erro ao ler body:", e);
    return {};
  }
}

// ============================================================
// 🌈 Handler principal
// ============================================================
export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();

  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID)
      return err(res, 500, "Chaves Airtable ausentes.");

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // ============================================================
    // POST → CADASTRO ou LOGIN
    // ============================================================
    if (req.method === "POST") {
      const body = await getBody(req);
      const { acao } = body || {};

      // ----------------------------- CADASTRO -----------------------------
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

        const emailEsc = escapeFormulaString(email_usuario);
        const existe = await base(TABLE_NAME)
          .select({
            filterByFormula: `{email_usuario}='${emailEsc}'`,
            maxRecords: 1,
          })
          .all();

        if (existe.length > 0) return err(res, 409, "E-mail já cadastrado.");

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
          mensagem: "Usuário cadastrado com sucesso.",
          id_usuario: novo[0].id,
        });
      }

      // ------------------------------- LOGIN -------------------------------
      if (acao === "login") {
        const { email_usuario, senha } = body || {};
        if (!email_usuario || !senha)
          return err(res, 400, "E-mail e senha obrigatórios.");

        const emailEsc = escapeFormulaString(email_usuario);
        const senhaEsc = escapeFormulaString(senha);

        const formula = `AND({email_usuario}='${emailEsc}', {senha}='${senhaEsc}', {status}='ativo')`;
        const registros = await base(TABLE_NAME)
          .select({ filterByFormula: formula, maxRecords: 1 })
          .all();

        if (registros.length === 0)
          return err(res, 401, "E-mail ou senha incorretos.");

        const usuario = registros[0].fields;

        return ok(res, {
          mensagem: "Login efetuado com sucesso.",
          usuario: {
            id: registros[0].id,
            nome_usuario: usuario.nome_usuario,
            email_usuario: usuario.email_usuario,
            tipo_usuario: usuario.tipo_usuario || "doador",
          },
        });
      }

      // ------------------------------- INVÁLIDO -------------------------------
      return err(res, 400, "Ação inválida. Use 'cadastro' ou 'login'.");
    }

    // ============================================================
    // GET → (opcional) listar usuários
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(TABLE_NAME)
        .select({ maxRecords: 5 })
        .all();

      const usuarios = registros.map((r) => ({
        id: r.id,
        ...r.fields,
      }));

      return ok(res, { total: usuarios.length, usuarios });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}
