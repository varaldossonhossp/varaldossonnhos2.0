// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão debug TCC)
// ------------------------------------------------------------
// API Serverless (Vercel) para Cadastro e Login de usuários.
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
// 🧰 Utilitários
// ============================================================
const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};
const ok = (res, data) => res.status(200).json(data);
const escapeFormulaString = (s) => (s ? s.replace(/'/g, "''") : "");

// ============================================================
// 🧩 Handler principal
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID)
      return err(res, 500, "Variáveis Airtable ausentes.");

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // ============================================================
    // POST → Gerencia login e cadastro
    // ============================================================
    if (req.method === "POST") {
      const { acao } = req.body || {};

      // ---------------------------- CADASTRO ----------------------------
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

        // Verifica duplicidade
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

        return ok({
          sucesso: true,
          mensagem: "Usuário cadastrado com sucesso.",
          id_usuario: novo[0].id,
        });
      }

      // ----------------------------- LOGIN -----------------------------
      if (acao === "login") {
        const { email_usuario, senha } = req.body || {};
        if (!email_usuario || !senha)
          return err(res, 400, "E-mail e senha obrigatórios.");

        const emailEsc = escapeFormulaString(email_usuario);
        const senhaEsc = escapeFormulaString(senha);

        const formula = `AND({email_usuario}='${emailEsc}', {senha}='${senhaEsc}', {status}='ativo')`;
        console.log("🧩 Executando login → formula:", formula, "tabela:", TABLE_NAME);

        let registros;
        try {
          registros = await base(TABLE_NAME)
            .select({ filterByFormula: formula, maxRecords: 1 })
            .all();
        } catch (airErr) {
          console.error("⚠️ Erro ao consultar Airtable:", airErr.message);
          return err(res, 500, "Falha ao consultar banco.", { detalhe: airErr.message });
        }

        if (!registros || registros.length === 0)
          return err(res, 401, "Credenciais inválidas.");

        const user = registros[0].fields;
        const { senha: _, ...dados } = user;

        return ok({
          sucesso: true,
          mensagem: "Login efetuado com sucesso.",
          usuario: dados,
          id_usuario: registros[0].id,
        });
      }

      return err(res, 400, "Ação inválida. Use 'login' ou 'cadastro'.");
    }

    // ============================================================
    // GET → Teste de conexão
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(TABLE_NAME)
        .select({ maxRecords: 5 })
        .all();
      const usuarios = registros.map((r) => ({
        id: r.id,
        ...r.fields,
      }));
      return ok({ sucesso: true, usuarios });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}
