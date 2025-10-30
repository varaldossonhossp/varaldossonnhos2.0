// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (VERSÃO FINAL E ROBUSTA)
// ------------------------------------------------------------
// Corrige o erro 500 movendo a importação do bcryptjs.
// ============================================================

import Airtable from "airtable";

// Variável para armazenar o módulo bcryptjs (cache)
let bcryptjsModule = null;

// Configuração do Vercel
export const config = { runtime: "nodejs" };

const TABLE_NAME =
  process.env.AIRTABLE_USUARIOS_TABLE || "usuarios";

const err = (res, code, msg, extra = {}) => {
  console.error("❌", code, msg, extra);
  return res.status(code).json({ sucesso: false, mensagem: msg, ...extra });
};

// Função para carregar o bcryptjs com cache e tratar erros
async function loadBcryptjs() {
    if (bcryptjsModule) {
        return bcryptjsModule; // Retorna o módulo em cache
    }
    
    try {
        // Importação dinâmica dentro da função, para evitar erro de topo de módulo
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
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // ============================================================
    // POST → Cadastro
    // ============================================================
    if (req.method === "POST") {
      console.log("📩 Requisição POST recebida em /api/usuarios");

      const {
        nome_usuario, email_usuario, telefone, senha, tipo_usuario,
        cidade, cep, endereco, numero,
      } = req.body || {};

      // Carrega o bcryptjs apenas quando for fazer o hash da senha
      const bcryptjs = await loadBcryptjs();
      
      // Validação de TODOS os campos obrigatórios (mantida)
      const camposObrigatorios = { nome_usuario, email_usuario, telefone, senha, tipo_usuario, cidade, cep, endereco, numero };
      const camposFaltando = Object.keys(camposObrigatorios).filter(key => !camposObrigatorios[key]);

      if (camposFaltando.length > 0)
        return err(res, 400, "Todos os campos de cadastro são obrigatórios.", { campos_faltando: camposFaltando });


      // VERIFICAÇÃO DE DUPLICIDADE (E-MAIL OU TELEFONE) (mantida)
      const emailLower = email_usuario.toLowerCase();
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


      // Criptografa a senha, se possível (agora usa o 'bcryptjs' carregado)
      let senhaFinal = senha;
      if (bcryptjs) {
        try {
          senhaFinal = await bcryptjs.hash(senha, 8);
        } catch (e) {
          console.warn("⚠️ Falha no hash, usando senha em texto:", e.message);
        }
      }

      // Cria o registro no Airtable (mantido)
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
    // GET → Login (Ajustado para usar o 'bcryptjs' carregado)
    // ============================================================
    if (req.method === "GET") {
      console.log("🔑 Requisição GET (login) recebida");
      const bcryptjs = await loadBcryptjs();

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