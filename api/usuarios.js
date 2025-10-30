// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (versão logada e segura)
// ------------------------------------------------------------
// Evita 500 no Vercel e aceita senhas texto puro ou criptografadas
// ============================================================

import Airtable from "airtable";

let bcryptjs = null;
try {
  bcryptjs = await import("bcryptjs");
  console.log("✅ bcryptjs carregado com sucesso");
} catch {
  console.warn("⚠️ bcryptjs não disponível — usando modo texto simples");
}

export const config = { runtime: "nodejs" };

const TABLE_NAME =
  process.env.AIRTABLE_USUARIOS_TABLE || "usuarios"; // <-- com 's'

const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // ============================================================
    // POST → Cadastro
    // ============================================================
    if (req.method === "POST") {
      console.log("📩 Requisição POST recebida em /api/usuarios");

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

      // Verifica duplicidade
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

      // Criptografa a senha, se possível
      let senhaFinal = senha;
      if (bcryptjs) {
        try {
          senhaFinal = await bcryptjs.hash(senha, 8);
        } catch (e) {
          console.warn("⚠️ Falha no hash, usando senha em texto:", e.message);
        }
      }

      // Cria o registro no Airtable
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
            data_cadastro: new Date().toLocaleDateString("pt-BR"),
          },
        },
      ]);

      console.log("✅ Usuário criado:", novo[0].id);

      return res.status(201).json({
        sucesso: true,
        mensagem: "Usuário cadastrado com sucesso.",
        id_usuario: novo[0].id,
      });
    }

    // ============================================================
    // GET → Login
    // ============================================================
    if (req.method === "GET") {
      console.log("🔑 Requisição GET (login) recebida");

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

      let match = false;
      try {
        if (bcryptjs && user.senha) match = await bcryptjs.compare(senha, user.senha);
      } catch {}
      if (!match && senha === user.senha) match = true;

      if (!match)
        return err(res, 401, "Senha incorreta.");

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
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}
