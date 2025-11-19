// ============================================================
// 📘 DOCUMENTAÇÃO TÉCNICA — /api/admin.js
// ============================================================
// 🔹 Finalidade da API:
//     - API administrativa (protegida por token) usada para
//       GERENCIAR EVENTOS do Varal dos Sonhos.
//     - Implementa CRUD completo (Criar, Listar, Atualizar, Excluir).
//     - É utilizada SOMENTE pelo painel administrativo.
//     - A página pública NÃO usa esta API.
//     - Gerencia a tabela de CONFIGURAÇÃO DO SITE
//       (logo, nuvem, instagram etc. em config_site).
//
// 🔹 Arquivos / Telas que consomem esta API:
//     - /pages/admin/cadastroevento.html
//     - /js/admin.js  (funções do painel)
//     - qualquer tela administrativa que edite eventos futuramente.
//
// 🔹 Tabelas utilizadas no Airtable:
//     🗂  Tabela: eventos       (CRUD completo)
//     🗂  Tabela: config_site   (configuração visual do site)
//
// 🔹 Campos utilizados pela API (conforme Airtable):
//     - id_evento               (ID do registro — automático Airtable)
//     - nome_evento             (Single line text)
//     - local_evento            (Single line text)
//     - descricao               (Long text)
//     - data_evento             (Date)
//     - data_limite_recebimento (Date)
//     - data_realizacao_evento  (Date)
//     - status_evento           (Single select: encerrado | em andamento | proximo)
//     - destacar_na_homepage    (Checkbox)
//     - imagem                  (Attachment[])
//     - ativo                   (Checkbox / Boolean)
//
// 🔹 Operações implementadas:
//
//   EVENTOS (tabela "eventos"):
//     • GET                      → listar todos os eventos
//     • POST acao="criar"        → criar novo evento
//     • POST acao="atualizar"    → atualizar campos parciais
//     • POST acao="excluir"      → excluir evento
//
//   CONFIG_SITE (tabela "config_site"):
//     • GET ?tipo=config_site
//          → retorna o primeiro registro de configuração
//     • POST acao="salvar_config_site"
//          → cria/atualiza o registro de configuração
//
// 🔹 Variáveis de ambiente exigidas:
//     - ADMIN_SECRET               (token do administrador)
//     - AIRTABLE_API_KEY           (chave Airtable)
//     - AIRTABLE_BASE_ID           (base Airtable)
//     - AIRTABLE_EVENTOS_TABLE     (nome da tabela de eventos — opcional)
//     - AIRTABLE_CONFIG_SITE_TABLE (nome da tabela de config — opcional)
//
// 🔹 Regras de segurança:
//     - Toda requisição precisa do header:  x-admin-token: SEU_TOKEN
//     - Sem token válido → 401 Token inválido.
//
// 🔹 Segurança:
//     - POST exige token ADMIN_SECRET
//     - GET config_site é público (para ser lido no index)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Respostas
const ok  = (res, data) => res.status(200).json(data);
const err = (res, code, msg) => res.status(code).json({ sucesso:false, mensagem:msg });

// ============================================================
// 🔐 AUTENTICAÇÃO — usada somente no POST
// ============================================================
function getToken(req) {
  return (
    req.headers["x-admin-token"] ||
    req.query.token_admin ||
    req.body?.token_admin ||
    ""
  );
}

function requireAuth(req, res) {

  // ⚠ IMPORTANTE:
  // GET config_site NÃO precisa de token → usada pelo site público
  if (req.method === "GET" && req.query.tipo === "config_site") {
    return true;
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return err(res, 500, "ADMIN_SECRET não configurado.");

  const token = getToken(req);
  if (!token) return err(res, 401, "Token ausente.");
  if (token !== secret) return err(res, 401, "Token inválido.");

  return true;
}

// ============================================================
// 📡 CONEXÃO AIRTABLE
// ============================================================
function getBase() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId)
    throw new Error("Chaves do Airtable ausentes.");

  return new Airtable({ apiKey }).base(baseId);
}

// ============================================================
// 🧩 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Auth (POST exige token, GET config_site não)
  if (!requireAuth(req, res)) return;

  const base = getBase();
  const eventosTable = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";
  const configTable  = process.env.AIRTABLE_CONFIG_SITE_TABLE || "config_site";

  const { tipo = "" } = req.query;

  try {

    // ============================================================
    // 📋 GET — CONFIG SITE (sem token)
    // ============================================================
    if (req.method === "GET" && tipo === "config_site") {
      const registros = await base(configTable)
        .select({ maxRecords: 1 })
        .all();

      const rec = registros[0] || null;

      return ok(res, {
        sucesso: true,
        config: rec ? { id: rec.id, ...rec.fields } : null,
      });
    }

    // ============================================================
    // 📋 GET — EVENTOS (com token)
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(eventosTable).select().all();
      return ok(res, { sucesso: true, eventos: registros });
    }

    // ============================================================
    // 📝 POST — AÇÕES ADMINISTRATIVAS
    // ============================================================
    const { acao } = req.body || {};

    // ------------------------------------------------------------
    // 🔧 SALVAR CONFIG DO SITE (LOGO / NUVEM / INSTAGRAM)
    //
    // body:
    //   acao:"salvar_config_site"
    //   campo:"logo" | "nuvem" | "instagram"
    //   valor:"https://..."
    // ------------------------------------------------------------
    if (acao === "salvar_config_site") {

      const { campo, valor } = req.body;

      if (!campo || !valor)
        return err(res, 400, "Campo e valor obrigatórios.");

      const registros = await base(configTable)
        .select({ maxRecords: 1 })
        .all();

      let recordId = registros[0]?.id;

      const fields = {};

      if (campo === "logo")      fields.logo_header   = valor;
      if (campo === "nuvem")     fields.nuvem_footer  = valor;
      if (campo === "instagram") fields.instagram_url = valor;

      fields.updated_at = new Date().toISOString();

      if (recordId) {
        await base(configTable).update([{ id: recordId, fields }]);
      } else {
        const novo = await base(configTable).create([{ fields }]);
        recordId = novo[0].id;
      }

      return ok(res, { sucesso:true, id:recordId });
    }

    // ------------------------------------------------------------
    // 🆕 EVENTO — CRIAR
    // ------------------------------------------------------------
    if (acao === "criar") {
      const novo = await base(eventosTable).create([
        { fields: req.body }
      ]);
      return ok(res, { sucesso: true, id: novo[0].id });
    }

    // ------------------------------------------------------------
    // ✏️ EVENTO — ATUALIZAR
    // ------------------------------------------------------------
    if (acao === "atualizar") {
      const { id_evento, fields } = req.body;

      if (!id_evento || !fields)
        return err(res, 400, "Dados insuficientes.");

      await base(eventosTable).update([{ id:id_evento, fields }]);
      return ok(res, { sucesso:true });
    }

    // ------------------------------------------------------------
    // 🗑️ EVENTO — EXCLUIR
    // ------------------------------------------------------------
    if (acao === "excluir") {
      const { id_evento } = req.body;

      if (!id_evento)
        return err(res, 400, "id_evento ausente.");

      await base(eventosTable).destroy([id_evento]);
      return ok(res, { sucesso:true });
    }

    return err(res, 400, "Ação inválida.");

  } catch (e) {
    console.error("Erro /api/admin:", e);
    return err(res, 500, e.message);
  }
}
