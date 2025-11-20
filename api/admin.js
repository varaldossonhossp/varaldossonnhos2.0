// ============================================================
// 💙 VARAL DOS SONHOS — /api/admin.js
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
//     - /pages/configuracao-site.html
//     - /js/admin.js  (funções do painel)
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
//   CONFIG_SITE (tabela "config_site"):
//     - nome_ong
//     - descricao_homepage
//     - logo_header      (Attachment[])
//     - nuvem_index      (Attachment[])
//     - instagram_url
//     - email_contato
//     - telefone_contato
//     - updated_at
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
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

const ok  = (res, data) => res.status(200).json(data);
const err = (res, code, msg) => res.status(code).json({ sucesso:false, mensagem:msg });

// ------------------------------------------------------------
// TOKEN
// ------------------------------------------------------------
function getToken(req) {
  return (
    req.headers["x-admin-token"] ||
    req.query.token_admin ||
    req.body?.token_admin ||
    ""
  );
}

function requireAuth(req, res) {
  if (req.method === "GET" && req.query.tipo === "config_site") {
    return true;
  }

  const secret = process.env.ADMIN_SECRET;
  const token  = getToken(req);

  if (!secret) return err(res, 500, "ADMIN_SECRET ausente.");
  if (!token)  return err(res, 401, "Token ausente.");
  if (token !== secret) return err(res, 401, "Token inválido.");

  return true;
}

// ------------------------------------------------------------
// Airtable
// ------------------------------------------------------------
function getBase() {
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
}

// ============================================================================
// HANDLER
// ============================================================================
export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (!requireAuth(req, res)) return;

  const base = getBase();
  const eventosTable = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";
  const configTable  = process.env.AIRTABLE_CONFIG_SITE_TABLE || "config_site";

  const { tipo = "" } = req.query;

  try {

    // ============================================================
    // GET — CONFIG_SITE
    // ============================================================
    if (req.method === "GET" && tipo === "config_site") {
      const registros = await base(configTable).select({ maxRecords: 1 }).all();
      const rec = registros[0] || null;

      return ok(res, {
        sucesso: true,
        config: rec ? { id: rec.id, ...rec.fields } : null,
      });
    }

    // ============================================================
    // GET EVENTOS
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(eventosTable).select().all();
      return ok(res, { sucesso: true, eventos: registros });
    }

    // ============================================================
    // POST — AÇÕES
    // ============================================================
    const body = req.body || {};
    const { acao } = body;

    // ============================================================
    // SALVAR CONFIG_SITE — CORRIGIDO
    // ============================================================
    if (acao === "salvar_config_site") {

      const registros = await base(configTable)
        .select({ maxRecords: 1 })
        .all();

      let recordId = registros[0]?.id || null;

      const dados = body.dados || {};
      const fields = {};

      // textos
      if (dados.nome_ong) fields.nome_ong = dados.nome_ong;
      if (dados.descricao_homepage) fields.descricao_homepage = dados.descricao_homepage;
      if (dados.instagram_url) fields.instagram_url = dados.instagram_url;
      if (dados.email_contato) fields.email_contato = dados.email_contato;
      if (dados.telefone_contato) fields.telefone_contato = dados.telefone_contato;

      // 🔥 attachments corretos
      if (dados.logo_header) {
        fields.logo_header = [{ url: dados.logo_header }];
      }

      if (dados.nuvem_index) {
        fields.nuvem_index = [{ url: dados.nuvem_index }];
      }

      if (!recordId) {
        const novo = await base(configTable).create([{ fields }]);
        recordId = novo[0].id;
      } else {
        await base(configTable).update([{ id: recordId, fields }]);
      }

      return ok(res, { sucesso:true, id: recordId });
    }

    // ============================================================
    // CRUD EVENTOS (SEM ALTERAÇÕES)
    // ============================================================
    if (acao === "criar") {
      const novo = await base(eventosTable).create([{ fields: body }]);
      return ok(res, { sucesso: true, id: novo[0].id });
    }

    if (acao === "atualizar") {
      await base(eventosTable).update([{ id: body.id_evento, fields: body.fields }]);
      return ok(res, { sucesso:true });
    }

    if (acao === "excluir") {
      await base(eventosTable).destroy([body.id_evento]);
      return ok(res, { sucesso:true });
    }

    return err(res, 400, "Ação inválida.");

  } catch (e) {
    console.error("Erro /api/admin:", e);
    return err(res, 500, e.message);
  }
}
