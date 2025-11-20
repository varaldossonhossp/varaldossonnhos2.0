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

// Helpers de resposta
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

  // ⚠ GET config_site é público (usado pelo site para carregar logo/nuvem)
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
  if (!apiKey || !baseId) throw new Error("Chaves do Airtable ausentes.");
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
    const body = req.body || {};
    const { acao } = body;

    // ------------------------------------------------------------
    // 🔧 SALVAR CONFIG DO SITE (MODO FICHA ÚNICA OU CAMPO/VALOR)
    // ------------------------------------------------------------
    if (acao === "salvar_config_site") {

      // 🔹 1) Carrega (ou cria) o registro único de configuração
      const registros = await base(configTable)
        .select({ maxRecords: 1 })
        .all();

      let recordId = registros[0]?.id || null;

      const fields = {};

      // 🔹 2) MODO NOVO – ficha única
      //    Espera um objeto "dados" com todos os campos
      const fonte =
        body.dados || body.fields || {
          nome_ong: body.nome_ong,
          descricao_homepage: body.descricao_homepage,
          instagram_url: body.instagram_url,
          email_contato: body.email_contato,
          telefone_contato: body.telefone_contato,
          logo_header: body.logo_header,
          nuvem_index: body.nuvem_index,
        };

      const temAlgumCampoNovo = Object.values(fonte).some(v => v !== undefined && v !== null && v !== "");

      if (temAlgumCampoNovo) {

        if (typeof fonte.nome_ong === "string") {
          fields.nome_ong = fonte.nome_ong;
        }

        if (typeof fonte.descricao_homepage === "string") {
          fields.descricao_homepage = fonte.descricao_homepage;
        }

        if (typeof fonte.instagram_url === "string") {
          fields.instagram_url = fonte.instagram_url;
        }

        if (typeof fonte.email_contato === "string") {
          fields.email_contato = fonte.email_contato;
        }

        if (typeof fonte.telefone_contato === "string") {
          fields.telefone_contato = fonte.telefone_contato;
        }

        // Logo (attachment)
        if (fonte.logo_header) {
          if (Array.isArray(fonte.logo_header)) {
            fields.logo_header = fonte.logo_header;
          } else if (typeof fonte.logo_header === "string") {
            fields.logo_header = [{ url: fonte.logo_header }];
          }
        }

        // Nuvem da home (attachment)
        if (fonte.nuvem_index) {
          if (Array.isArray(fonte.nuvem_index)) {
            fields.nuvem_index = fonte.nuvem_index;
          } else if (typeof fonte.nuvem_index === "string") {
            fields.nuvem_index = [{ url: fonte.nuvem_index }];
          }
        }
      } else {
        // 🔹 3) MODO ANTIGO – campo/valor (ainda suportado)
        const { campo, valor } = body;

        if (!campo || !valor) {
          return err(res, 400, "Nenhum dado de configuração informado.");
        }

        if (campo === "logo") {
          fields.logo_header = [{ url: valor }];
        } else if (campo === "nuvem") {
          fields.nuvem_index = [{ url: valor }];
        } else if (campo === "instagram") {
          fields.instagram_url = valor;
        } else if (campo === "email") {
          fields.email_contato = valor;
        } else if (campo === "telefone") {
          fields.telefone_contato = valor;
        } else if (campo === "nome_ong") {
          fields.nome_ong = valor;
        } else if (campo === "descricao_homepage") {
          fields.descricao_homepage = valor;
        }
      }

      // Se por algum motivo não sobrou nada pra salvar:
      if (Object.keys(fields).length === 0) {
        return err(res, 400, "Nenhum campo válido para salvar em config_site.");
      }

      fields.updated_at = new Date().toISOString();

      if (recordId) {
        await base(configTable).update([{ id: recordId, fields }]);
      } else {
        const novo = await base(configTable).create([{ fields }]);
        recordId = novo[0].id;
      }

      return ok(res, { sucesso: true, id: recordId, fields });
    }

    // ------------------------------------------------------------
    // 🆕 EVENTO — CRIAR
    // ------------------------------------------------------------
    if (acao === "criar") {
      const novo = await base(eventosTable).create([
        { fields: body }
      ]);
      return ok(res, { sucesso: true, id: novo[0].id });
    }

    // ------------------------------------------------------------
    // ✏️ EVENTO — ATUALIZAR
    // ------------------------------------------------------------
    if (acao === "atualizar") {
      const { id_evento, fields } = body;

      if (!id_evento || !fields)
        return err(res, 400, "Dados insuficientes.");

      await base(eventosTable).update([{ id: id_evento, fields }]);
      return ok(res, { sucesso:true });
    }

    // ------------------------------------------------------------
    // 🗑️ EVENTO — EXCLUIR
    // ------------------------------------------------------------
    if (acao === "excluir") {
      const { id_evento } = body;

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
