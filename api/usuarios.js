// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (VERSÃO ROBUSTA FINAL)
// ------------------------------------------------------------
// ✅ Inicialização do Airtable movida para DENTRO do handler (ROBUSTO).
// ✅ Teste de chave de API no início do handler (DEBUG).
// ✅ Modo de Senha Simples (Login e Cadastro) para estabilidade.
// ============================================================

import Airtable from "airtable";

// As variáveis de ambiente serão lidas dentro do handler para garantir que estejam prontas.
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Configuração do Vercel
export const config = { runtime: "nodejs" };

const TABLE_NAME =
  process.env.AIRTABLE_USUARIOS_TABLE || "usuario"; // Usando 'usuario' conforme suas imagens

const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

// Função auxiliar para evitar erro de sintaxe na fórmula (Essencial para Airtable)
const escapeFormulaString = (str) => {
    // Substitui aspas simples (') por duas aspas simples ('')
    return str ? str.replace(/'/g, "''") : ''; 
};


export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ============================================================
    // 🔑 INICIALIZAÇÃO E TESTE DE CHAVE ROBUSTO
    // ============================================================
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        return err(res, 500, "ERRO CRÍTICO: Chaves de ambiente do Airtable ausentes.", { detalhe: "AIRTABLE_API_KEY ou BASE_ID não configurados na Vercel." });
    }
    
    // 💡 TESTE DE LEITURA (Se o token não começar com 'pat', é um aviso)
    if (!AIRTABLE_API_KEY.startsWith("pat")) {
        console.warn("⚠️ A chave Airtable não parece ser um Personal Access Token (PAT). Confirme se a chave API legada está correta.");
    }

    // Inicialização da Base DEPOIS de confirmar que as chaves foram lidas.
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
        .base(AIRTABLE_BASE_ID);
    // FIM DA INICIALIZAÇÃO ROBUSTA


    // ============================================================
    // POST → Cadastro (Modo Senha Simples)
    // ============================================================
    if (req.method === "POST") {
      console.log("📩 Requisição POST recebida em /api/usuarios (Cadastro SIMPLES)");

      const {
        nome_usuario, email_usuario, telefone, senha, tipo_usuario,
        cidade, cep, endereco, numero,
      } = req.body || {};
      
      // Validação de TODOS os campos obrigatórios
      const camposObrigatorios = { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero };
      const camposFaltando = Object.keys(camposObrigatorios).filter(key => !camposObrigatorios[key]);

      if (camposFaltando.length > 0)
        return err(res, 400, "Todos os campos de cadastro são obrigatórios.", { campos_faltando: camposFaltando });


      // VERIFICAÇÃO DE DUPLICIDADE (E-MAIL OU TELEFONE)
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


      // ⚠️ MODO SENHA SIMPLES ATIVADO: A senha é salva como texto puro.
      let senhaFinal = senha; 

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

      // Filtro que busca email + senha simples
      const formula = `AND({email_usuario}='${emailEscapado}', {senha}='${senhaEscapada}', {status}='ativo')`;
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

      const { senha: _, ...dados } = user;
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
    // Se houver um erro de autorização do Airtable, ele será capturado aqui
    return err(res, 500, "Erro interno no servidor.", { detalhe: e.message });
  }
}