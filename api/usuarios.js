// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (VERSÃO FINAL COM NOME DE CAMPO CORRIGIDO)
// ------------------------------------------------------------
// ✅ Inicialização robusta.
// ✅ TABLE_NAME CORRIGIDO para 'usuarios' (como na Vercel).
// ✅ Nome do campo de senha CORRIGIDO para {'A senha'} (tanto POST quanto GET).
// ============================================================

import Airtable from "airtable";

// Variáveis de ambiente
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Configuração do Vercel
export const config = { runtime: "nodejs" };

// 🚨 Tabela: Usando o nome exato da variável da Vercel: 'usuarios'
const TABLE_NAME =
  process.env.AIRTABLE_USUARIOS_TABLE || "usuarios"; 

const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

// Função auxiliar para evitar erro de sintaxe na fórmula
const escapeFormulaString = (str) => {
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
    
    if (!AIRTABLE_API_KEY.startsWith("pat")) {
        console.warn("⚠️ A chave Airtable não parece ser um Personal Access Token (PAT). Confirme se a chave API legada está correta.");
    }

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
        .base(AIRTABLE_BASE_ID);


    // ============================================================
    // POST → Cadastro (Modo Senha Simples)
    // ============================================================
    if (req.method === "POST") {
      console.log("📩 Requisição POST recebida em /api/usuarios (Cadastro SIMPLES)");

      const {
        nome_usuario, email_usuario, telefone, senha, tipo_usuario,
        cidade, cep, endereco, numero,
      } = req.body || {};
      
      const camposObrigatorios = { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero };
      const camposFaltando = Object.keys(camposObrigatorios).filter(key => !camposObrigatorios[key]);

      if (camposFaltando.length > 0)
        return err(res, 400, "Todos os campos de cadastro são obrigatórios.", { campos_faltando: camposFaltando });


      // VERIFICAÇÃO DE DUPLICIDADE
      const emailLower = escapeFormulaString(email_usuario).toLowerCase();
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

      let senhaFinal = senha; 

      // Cria o registro no Airtable
      const novo = await base(TABLE_NAME).create([
        {
          fields: {
            nome_usuario, email_usuario, telefone, 
             // 🚨 CORREÇÃO DE CAMPO: Usando o nome do campo como 'A senha' na criação
             'A senha': senhaFinal, 
            tipo_usuario, cidade, cep, endereco, numero,
            status: "ativo",
            data_cadastro: new Date().toLocaleDateString("pt-BR"),
          },
        },
      ]);

      console.log("✅ Usuário criado:", novo[0].id);

      return res.status(201).json({
        sucesso: true,
        mensagem: "Usuário cadastrado com sucesso. (Senha Simples)",
        id_usuario: novo[0].id,
      });
    }
    
    // ============================================================
    // GET → Login (Busca Direta no Airtable com Senha Simples)
    // ============================================================
    if (req.method === "GET") {
      console.log("🔑 Requisição GET (login) recebida. MODO SENHA SIMPLES ATIVADO.");

      const { email, senha } = req.query || {};
      if (!email || !senha)
        return err(res, 400, "E-mail e senha são obrigatórios para login.");

      const emailEscapado = escapeFormulaString(email);
      const senhaEscapada = escapeFormulaString(senha);

      // 🚨 CORREÇÃO DE CAMPO: Usando o nome do campo como 'A senha' na busca (GET)
      const formula = `AND({email_usuario}='${emailEscapado}', {'A senha'}='${senhaEscapada}', {status}='ativo')`;
      console.log("🔍 Airtable Formula (Senha Simples):", formula);

      const registros = await base(TABLE_NAME)
        .select({
          filterByFormula: formula,
          maxRecords: 1,
        })
        .all();

      if (registros.length === 0)
        return err(res, 401, "Credenciais inválidas. Verifique o e-mail e a senha.");

      const user = registros[0].fields;

      // A linha abaixo foi ajustada para remover a senha do retorno, usando o nome do campo correto
      const { 'A senha': _, ...dados } = user;
      return res.status(200).json({
        sucesso: true,
        mensagem: "Login efetuado com sucesso (MODO SIMPLES).",
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