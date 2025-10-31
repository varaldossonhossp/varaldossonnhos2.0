// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão final TCC)
// ------------------------------------------------------------
// API Serverless (Vercel) para Cadastro e Login de usuários.
// Tabela Airtable: "usuario"
// Campos: nome_usuario, email_usuario, telefone, senha,
// tipo_usuario, cidade, cep, endereco, numero, status
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

const ok = (res, data) => res.status(200).json(data);

const escapeFormulaString = (str) => (str ? str.replace(/'/g, "''") : "");

// ============================================================
// 🧩 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  // Configuração básica CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID)
      return err(res, 500, "Chaves Airtable ausentes.");

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // ============================================================
    // POST → Gerencia CADASTRO e LOGIN (via campo "acao")
    // ============================================================
    if (req.method === "POST") {
      const { acao } = req.body || {};

      // ============================================================
      // 🧩 CADASTRO DE NOVO USUÁRIO
      // ------------------------------------------------------------
      // Espera: nome_usuario, email_usuario, senha (obrigatórios)
      // ============================================================
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
        } = req.body || {};

        if (!nome_usuario || !email_usuario || !senha)
          return err(res, 400, "Campos obrigatórios ausentes.");

        // Verifica se já existe o e-mail cadastrado
        const registrosExistentes = await base(TABLE_NAME)
          .select({
            filterByFormula: `{email_usuario}='${escapeFormulaString(email_usuario)}'`,
            maxRecords: 1,
          })
          .all();

        if (registrosExistentes.length > 0)
          return err(res, 409, "E-mail já cadastrado.");

        // Cria novo registro no Airtable
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

        return ok({
          sucesso: true,
          mensagem: "Usuário cadastrado com sucesso.",
          id_usuario: novo[0].id,
        });
      }

      // ============================================================
      // 🧩 LOGIN DO USUÁRIO
      // ------------------------------------------------------------
      // Espera: email_usuario e senha (via body)
      // ============================================================
      if (acao === "login") {
        const { email_usuario, senha } = req.body || {};
        if (!email_usuario || !senha)
          return err(res, 400, "E-mail e senha são obrigatórios.");

        const emailEsc = escapeFormulaString(email_usuario);
        const senhaEsc = escapeFormulaString(senha);

        const formula = `AND({email_usuario}='${emailEsc}', {senha}='${senhaEsc}', {status}='ativo')`;

        const registros = await base(TABLE_NAME)
          .select({ filterByFormula: formula, maxRecords: 1 })
          .all();

        if (!registros.length) return err(res, 401, "Credenciais inválidas.");

        const user = registros[0].fields;
        const { senha: _, ...dados } = user;

        return ok({
          sucesso: true,
          mensagem: "Login efetuado com sucesso.",
          usuario: dados,
          id_usuario: registros[0].id,
        });
      }

      // ============================================================
      // ❌ Caso o campo "acao" não seja reconhecido
      // ============================================================
      return err(res, 400, "Ação inválida. Use 'login' ou 'cadastro'.");
    }

    // ============================================================
    // GET → Consulta simples (opcional / debug)
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(TABLE_NAME)
        .select({ maxRecords: 10, sort: [{ field: "nome_usuario" }] })
        .all();

      const usuarios = registros.map((r) => ({
        id: r.id,
        ...r.fields,
      }));

      return ok({ sucesso: true, total: usuarios.length, usuarios });
    }

    // Método não permitido
    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}
