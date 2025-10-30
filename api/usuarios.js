// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (Vercel Backend)
// ------------------------------------------------------------
// • Login compatível com senhas antigas (texto puro) e novas (bcrypt)
// • Cadastro com checagem de duplicidade (email e telefone)
// • Enriquecimento de endereço por CEP (ViaCEP) quando faltar
// ============================================================

import Airtable from "airtable";
import bcrypt from "bcryptjs";

export const config = { runtime: "nodejs" };

const TABLE_NAME = process.env.AIRTABLE_USUARIOS_TABLE || "usuario";

// Util: resposta de erro padronizada sempre em JSON
const err = (res, code, msg, extra = {}) =>
  res.status(code).json({ sucesso: false, mensagem: msg, ...extra });

// Normalizadores
const toLower = (s) => (s || "").toString().trim().toLowerCase();
const onlyDigits = (s) => (s || "").toString().replace(/\D/g, "");

// Busca endereço no ViaCEP (backend)
async function buscarViaCEP(cep) {
  const limpo = onlyDigits(cep);
  if (limpo.length !== 8) return null;

  try {
    const r = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.erro) return null;

    return {
      cep: limpo,
      logradouro: j.logradouro || "",
      bairro: j.bairro || "",
      localidade: j.localidade || "",
      uf: j.uf || "",
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 📝 CADASTRO (POST)
    // Body esperado: { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero }
    // Regras:
    //  - Email obrigatório e único
    //  - Telefone obrigatório e único (considerando apenas dígitos)
    //  - Se faltar endereço/cidade mas vier CEP válido -> preencher via ViaCEP
    // ============================================================
    if (req.method === "POST") {
      const body = req.body || {};
      const nome_usuario = (body.nome_usuario || "").trim();
      const email_usuario = toLower(body.email_usuario);
      const telefoneRaw = body.telefone || "";
      const telefone_digits = onlyDigits(telefoneRaw);
      const senha = body.senha || "";
      const tipo_usuario = body.tipo_usuario || "doador";
      let { cidade, cep, endereco, numero } = body;

      if (!email_usuario || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para o cadastro.");

      if (!telefone_digits)
        return err(res, 400, "Telefone é obrigatório para o cadastro.");

      // 🔎 Checagem de duplicidade (email OU telefone)
      // Usa REGEX_REPLACE no Airtable para comparar telefone apenas por dígitos
      const dupFormula = `
        OR(
          LOWER({email_usuario}) = LOWER("${email_usuario}"),
          REGEX_REPLACE({telefone}, "\\\\D", "") = "${telefone_digits}"
        )
      `;
      const existentes = await base(TABLE_NAME)
        .select({ filterByFormula: dupFormula })
        .all();

      if (existentes.length > 0) {
        // Descobrir qual campo conflitou para mensagem clara
        const e = existentes[0].fields;
        const conflitouEmail =
          toLower(e.email_usuario) === email_usuario;
        const conflitouTel =
          onlyDigits(e.telefone) === telefone_digits;

        const qual = [
          conflitouEmail ? "e-mail" : null,
          conflitouTel ? "telefone" : null,
        ]
          .filter(Boolean)
          .join(" e ");

        return err(res, 409, `Já existe cadastro com este ${qual}.`);
      }

      // 🧭 CEP -> completa endereço/cidade se necessário
      if ((!endereco || !cidade) && cep) {
        const via = await buscarViaCEP(cep);
        if (via) {
          cep = via.cep;
          endereco = endereco || [via.logradouro, via.bairro].filter(Boolean).join(" - ");
          cidade = cidade || [via.localidade, via.uf].filter(Boolean).join("/");
        }
      }

      // 🔐 Hash da senha (cadastros novos sempre com bcrypt)
      const hash = await bcrypt.hash(senha, 8);

      const criado = await base(TABLE_NAME).create([
        {
          fields: {
            nome_usuario,
            email_usuario,
            telefone: telefoneRaw,
            senha: hash,
            tipo_usuario,
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
        id_usuario: criado[0].id,
      });
    }

    // ============================================================
    // 🔑 LOGIN (GET)
    // Query: ?email=...&senha=...
    // Aceita senha antiga (texto puro) e nova (hash bcrypt)
    // ============================================================
    if (req.method === "GET") {
      const { email, senha } = req.query || {};
      const email_q = toLower(email);

      if (!email_q || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para o login.");

      const records = await base(TABLE_NAME)
        .select({
          filterByFormula: `AND(LOWER({email_usuario}) = LOWER("${email_q}"), {status} = "ativo")`,
        })
        .all();

      if (records.length === 0)
        return err(res, 401, "Usuário não encontrado ou inativo.");

      const rec = records[0];
      const user = rec.fields;

      // 🔐 Comparação híbrida
      let match = false;
      try {
        match = await bcrypt.compare(senha, user.senha || "");
      } catch {
        match = senha === (user.senha || "");
      }

      if (!match) return err(res, 401, "Senha incorreta.");

      // Não retornar a senha
      const { senha: _omit, ...usuarioDados } = user;

      return res.status(200).json({
        sucesso: true,
        usuario: usuarioDados,
        id_usuario: rec.id,
      });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro /api/usuarios:", e);
    return err(res, 500, "Erro interno do servidor.", { detalhe: e.message });
  }
}
