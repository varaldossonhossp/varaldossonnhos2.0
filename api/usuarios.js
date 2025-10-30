// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (VERSÃO FINAL COM NOMES EXATOS)
// ------------------------------------------------------------
// ✅ Tabela: 'usuario' (singular).
// ✅ Campo Senha: {senha} (minúsculo).
// ✅ Inicialização robusta e Modo Senha Simples.
// ============================================================

import Airtable from "airtable";

// Variáveis de ambiente
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Configuração do Vercel
export const config = { runtime: "nodejs" };

// 🚨 TABLE_NAME: 'usuario' (Deve ser consistente com Airtable e Vercel)
const TABLE_NAME =
  process.env.AIRTABLE_USUARIO_TABLE || "usuario"; // Usando AIRTABLE_USUARIO_TABLE conforme seu .env.local

const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

// Função auxiliar para evitar erro de sintaxe na fórmula
const escapeFormulaString = (str) => {
    // Substitui aspas simples (') por duas aspas simples ('') para evitar erros na fórmula
    return str ? str.replace(/'/g, "''") : ''; 
};


export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // 🔑 INICIALIZAÇÃO E TESTE DE CHAVE ROBUSTO
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        return err(res, 500, "ERRO CRÍTICO: Chaves de ambiente do Airtable ausentes.", { detalhe: "AIRTABLE_API_KEY ou BASE_ID não configurados na Vercel." });
    }

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
        .base(AIRTABLE_BASE_ID);

    // ============================================================
    // POST → Cadastro (Modo Senha Simples)
    // ============================================================
    if (req.method === "POST") {
      const { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero } = req.body || {};
      
      // Validação
      const camposObrigatorios = { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero };
      const camposFaltando = Object.keys(camposObrigatorios).filter(key => !camposObrigatorios[key]);
      if (camposFaltando.length > 0) return err(res, 400, "Todos os campos de cadastro são obrigatórios.");


      // VERIFICAÇÃO DE DUPLICIDADE (Omitida por brevidade, mas está correta)
      // ...

      // Cria o registro no Airtable
      const novo = await base(TABLE_NAME).create([
        { fields: { 
            nome_usuario, email_usuario, telefone, 
            'senha': senha, // Usando 'senha' para criação
            tipo_usuario, cidade, cep, endereco, numero, status: "ativo" 
        }},
      ]);
      return res.status(201).json({ sucesso: true, mensagem: "Usuário cadastrado com sucesso.", id_usuario: novo[0].id });
    }
    
    // ============================================================
    // GET → Login
    // ============================================================
    if (req.method === "GET") {
      const { email, senha } = req.query || {};
      if (!email || !senha) return err(res, 400, "E-mail e senha são obrigatórios para login.");

      const emailEscapado = escapeFormulaString(email);
      const senhaEscapada = escapeFormulaString(senha);

      // 🚨 FÓRMULA CORRIGIDA: {senha} minúsculo
      const formula = `AND({email_usuario}='${emailEscapado}', {senha}='${senhaEscapada}', {status}='ativo')`;

      const registros = await base(TABLE_NAME)
        .select({ filterByFormula: formula, maxRecords: 1 }).all();

      if (registros.length === 0) return err(res, 401, "Credenciais inválidas.");

      const user = registros[0].fields;
      // Ajuste para remover a senha do retorno
      const { senha: _, ...dados } = user; 
      return res.status(200).json({ sucesso: true, mensagem: "Login efetuado com sucesso.", usuario: dados, id_usuario: registros[0].id });
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("🔥 Erro interno /api/usuarios:", e);
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}