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
// ============================================================
// DOCUMENTAÇÃO TÉCNICA — /api/admin.js
// ============================================================
// 🔹 Finalidade da API:
//     - Gerenciar EVENTOS
//     - Gerenciar CONFIGURAÇÃO DO SITE (config_site)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

const ok = (res, data) => res.status(200).json(data);
const err = (res, code, msg) =>
  res.status(code).json({ sucesso: false, mensagem: msg });

// ============================================================
// 🔐 Autenticação administrativa
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
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return err(res, 500, "ADMIN_SECRET não configurado.");

  const token = getToken(req);
  if (!token) return err(res, 401, "Token ausente.");

  if (token !== secret) return err(res, 401, "Token inválido.");

  return true;
}

// ============================================================
// 📡 Conexão Airtable
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

  // Auth
  if (!requireAuth(req, res)) return;

  const base = getBase();
  const eventosTable = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";
  const configTable = process.env.AIRTABLE_CONFIG_SITE_TABLE || "config_site";

  const { tipo = "" } = req.query;

  try {
    // ==========================================================
    // 📋 GET — CONFIG SITE
    // ==========================================================
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

    // ==========================================================
    // 📋 GET — EVENTOS
    // ==========================================================
    if (req.method === "GET") {
      const registros = await base(eventosTable).select().all();
      return ok(res, { sucesso: true, eventos: registros });
    }

    // ==========================================================
    // 📝 POST
    // ==========================================================
    const body = req.body || {};
    const { acao } = body;

    // ----------------------------------------------------------
    // 🔧 SALVAR CONFIG SITE (campo e valor)
    //
    // usado pela página configuracao-site.html
    //
    // body:
    //   campo: "logo" | "nuvem" | "instagram"
    //   valor: "url ou texto"
    // ----------------------------------------------------------
    if (acao === "salvar_config_site") {
      const { campo, valor } = body;

      if (!campo || !valor)
        return err(res, 400, "Campo e valor obrigatórios.");

      // BUSCAR registro único OU criar
      const existentes = await base(configTable)
        .select({ maxRecords: 1 })
        .all();

      let recordId = existentes[0]?.id;

      const fields = {};
      if (campo === "logo") fields.logo_header = valor;
      if (campo === "nuvem") fields.nuvem_footer = valor;
      if (campo === "instagram") fields.instagram_url = valor;

      fields.updated_at = new Date().toISOString();

      if (recordId) {
        await base(configTable).update([{ id: recordId, fields }]);
      } else {
        const novo = await base(configTable).create([{ fields }]);
        recordId = novo[0].id;
      }

      return ok(res, { sucesso: true, id: recordId });
    }

    // ----------------------------------------------------------
    // 🆕 EVENTOS — Criar
    // ----------------------------------------------------------
    if (acao === "criar") {
      const {
        nome_evento,
        local_evento,
        descricao,
        data_evento,
        data_limite_recebimento,
        data_realizacao_evento,
        status_evento,
        destacar_na_homepage,
        imagem,
      } = body;

      const novo = await base(eventosTable).create([
        {
          fields: {
            nome_evento,
            local_evento,
            descricao,
            data_evento: data_evento || null,
            data_limite_recebimento: data_limite_recebimento || null,
            data_realizacao_evento: data_realizacao_evento || null,
            destacar_na_homepage: !!destacar_na_homepage,
            imagem: Array.isArray(imagem) ? imagem : [],
            status_evento: status_evento || "em andamento",
            ativo: true,
          },
        },
      ]);

      return ok(res, { sucesso: true, id: novo[0].id });
    }

    // ----------------------------------------------------------
    // ✏️ EVENTOS — Atualizar
    // ----------------------------------------------------------
    if (acao === "atualizar") {
      const { id_evento, fields } = body;
      if (!id_evento || !fields)
        return err(res, 400, "Dados insuficientes.");

      await base(eventosTable).update([{ id: id_evento, fields }]);

      return ok(res, { sucesso: true });
    }

    // ----------------------------------------------------------
    // 🗑️ EVENTOS — Excluir
    // ----------------------------------------------------------
    if (acao === "excluir") {
      const { id_evento } = body;

      if (!id_evento)
        return err(res, 400, "id_evento ausente.");

      await base(eventosTable).destroy([id_evento]);

      return ok(res, { sucesso: true });
    }

    return err(res, 400, "Ação inválida.");
  } catch (e) {
    console.error("Erro /api/admin:", e);
    return err(res, 500, e.message);
  }
}
