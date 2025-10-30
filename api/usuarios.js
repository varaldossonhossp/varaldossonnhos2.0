// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (VERSÃO CORRIGIDA E TEMPORARIAMENTE SIMPLES)
// ------------------------------------------------------------
// ✅ Aplicação da correção de 'escaping' na fórmula do Airtable.
// ✅ Desabilita o hash de senha no cadastro (POST) para salvar a senha em texto simples.
// ============================================================

import Airtable from "airtable";

// ============================================================
// 🔑 Inicialização do Airtable
// ============================================================
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
  .base(AIRTABLE_BASE_ID);

// Variável para armazenar o módulo bcryptjs (cache)
let bcryptjsModule = null;

// Configuração do Vercel
export const config = { runtime: "nodejs" };

const TABLE_NAME =
  process.env.AIRTABLE_USUARIOS_TABLE || "usuario"; // Corrigido para "usuario" conforme suas tabelas

const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

// ============================================================
// 🔧 Função auxiliar para evitar erro de sintaxe na fórmula (Correção Crítica!)
// ============================================================
const escapeFormulaString = (str) => {
    // Substitui aspas simples (') por duas aspas simples ('') - Essencial para Airtable
    // E garante que o valor seja tratado como string no Airtable
    return str ? str.replace(/'/g, "''") : ''; 
};


async function loadBcryptjs() {
    if (bcryptjsModule) {
        return bcryptjsModule;
    }
    
    try {
        const bcryptjs = await import("bcryptjs");
        bcryptjsModule = bcryptjs;
        console.log("✅ bcryptjs carregado com sucesso");
        return bcryptjs;
    } catch (e) {
        console.warn("⚠️ bcryptjs não disponível — usando modo texto simples. Erro:", e.message);
        return null;
    }
}


export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ============================================================
    // POST → Cadastro (Modo de Senha Simples TEMPORÁRIO)
    // ============================================================
    if (req.method === "POST") {
      console.log("📩 Requisição POST recebida em /api/usuarios (Cadastro)");

      const {
        nome_usuario, email_usuario, telefone, senha, tipo_usuario,
        cidade, cep, endereco, numero,
      } = req.body || {};

      // Carrega o bcryptjs, mas não o usa para o hash (temporariamente)
      // const bcryptjs = await loadBcryptjs(); // Carregar, mas não usar.
      
      // Validação de TODOS os campos obrigatórios
      const camposObrigatorios = { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero };
      const camposFaltando = Object.keys(camposObrigatorios).filter(key => !camposObrigatorios[key]);

      if (camposFaltando.length > 0)
        return err(res, 400, "Todos os campos de cadastro são obrigatórios.", { campos_faltando: camposFaltando });


      // VERIFICAÇÃO DE DUPLICIDADE (E-MAIL OU TELEFONE)
      const emailLower = escapeFormulaString(email_usuario).toLowerCase(); // Aplicando escape aqui também
      const telefoneNumerico = telefone.replace(/\D/g, "");

      const formula = `
        OR(
          LOWER({email_usuario})='${emailLower}',
          REGEX_REPLACE({telefone}, "\\\\D", "")='${telefoneNumerico}'
        )
      `;
      const existentes = await base(TABLE_NAME).select({ filterByFormula: formula }).all();

      if (existentes.length > 0)
        return err(res, 409, "Já existe cadastro com este e-mail ou telefone.");


      // ⚠️ MODO SENHA SIMPLES TEMPORÁRIO
      let senhaFinal = senha; // A senha é salva como texto puro.
      /*
      // Criptografa a senha, se possível (VERSÃO SEGURA QUE VAI VOLTAR)
      if (bcryptjs) {
        try {
          senhaFinal = await bcryptjs.hash(senha, 8);
        } catch (e) {
          console.warn("⚠️ Falha no hash, usando senha em texto:", e.message);
        }
      }
      */

      // Cria o registro no Airtable
      const novo = await base(TABLE_NAME).create([
        {
          fields: {
            nome_usuario, email_usuario, telefone, senha: senhaFinal, 
            tipo_usuario, cidade, cep, endereco, numero,
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
    // GET → Login (Modo Criptografia + Senha Simples Fallback)
    // ============================================================
    if (req.method === "GET") {
      console.log("🔑 Requisição GET (login) recebida");
      const bcryptjs = await loadBcryptjs();

      const { email, senha } = req.query || {};
      if (!email || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para login.");

      // ✅ CORREÇÃO AQUI: Aplicação da função de escape no email
      const emailEscapado = escapeFormulaString(email).toLowerCase();

      const formula = `AND(LOWER({email_usuario})='${emailEscapado}', {status}='ativo')`;
      console.log("🔍 Airtable Formula:", formula); // LOG para debug

      const registros = await base(TABLE_NAME)
        .select({
          filterByFormula: formula,
        })
        .all();

      if (registros.length === 0)
        return err(res, 401, "Usuário não encontrado ou inativo.");

      const user = registros[0].fields;

      let match = false;
      try {
        // 1. Tenta comparar com senha criptografada (hashed)
        if (bcryptjs && user.senha) match = await bcryptjs.compare(senha, user.senha);
      } catch (e) {
        console.warn("⚠️ Erro na comparação de hash, tentando modo simples.", e.message);
      }
      
      // 2. Fallback: Compara com senha simples (para senhas "123456")
      if (!match && senha === user.senha) {
        match = true;
        console.log("✅ Login com sucesso: Senha simples detectada.");

        /* * 💡 FUTURA MELHORIA: AQUI VOCÊ PODE RE-CRIPTOGRAFAR A SENHA E SALVÁ-LA 
         * DE VOLTA NO AIRTABLE (MIGRAÇÃO DE SENHA ASSÍNCRONA).
         */
      }

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
    // Garante que o detalhe do erro seja logado no Vercel para você
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}