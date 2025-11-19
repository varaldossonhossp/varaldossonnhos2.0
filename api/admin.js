// ============================================================
// VARAL DOS SONHOS — /api/admin.js
// ============================================================
// 🔹 Finalidade da API:
//     - API administrativa (protegida por token) usada para
//       GERENCIAR EVENTOS do Varal dos Sonhos.
//     - Implementa CRUD completo (Criar, Listar, Atualizar, Excluir).
//     - Gerencia também a tabela de CONFIGURAÇÃO DO SITE
//       (logo, nuvem_index, instagram etc. em config_site).
//
// 🔹 Arquivos / Telas que consomem esta API:
//     - /pages/admin/cadastroevento.html
//     - /pages/configuracao-site.html
//     - /js/admin.js
//     - /js/configuracao-site.js
//
// 🔹 Tabelas utilizadas no Airtable:
//     🗂  Tabela: eventos       (CRUD completo)
//     🗂  Tabela: config_site   (configuração visual do site)
//
// 🔹 Campos utilizados na tabela eventos (conforme Airtable):
//     - id_evento
//     - nome_evento
//     - local_evento
//     - descricao
//     - data_evento
//     - data_limite_recebimento
//     - data_realizacao_evento
//     - status_evento
//     - destacar_na_homepage
//     - imagem
//     - ativo
//
// 🔹 Campos utilizados na tabela config_site:
//     - nome_ong              (Single line text)
//     - descricao_homepage    (Long text)
//     - logo_header           (Attachment[])
//     - nuvem_index           (Attachment[])
//     - instagram_url         (Single line text)
//     - email_contato         (Single line text)
//     - telefone_contato      (Single line text)
//     - updated_at            (Date/Time)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Helpers de resposta
const ok  = (res, data) => res.status(200).json(data);
const err = (res, code, msg) => res.status(code).json({ sucesso: false, mensagem: msg });

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
  // GET config_site é pública (usada pelo front do site)
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
    // ==========================================================
    // 📋 GET — CONFIG SITE (público, sem token)
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
    // 📋 GET — EVENTOS (com token)
    // ==========================================================
    if (req.method === "GET") {
      const registros = await base(eventosTable).select().all();
      return ok(res, { sucesso: true, eventos: registros });
    }

    // ==========================================================
    // 📝 POST — AÇÕES ADMINISTRATIVAS
    // ==========================================================
    const { acao } = req.body || {};

    // ----------------------------------------------------------
    // 🔧 SALVAR CONFIG DO SITE (FICHA ÚNICA)
    // body esperado:
    // {
    //   acao: "salvar_config_site",
    //   id: "recXXXXXXXX" | null,
    //   dados: {
    //     nome_ong,
    //     descricao_homepage,
    //     instagram_url,
    //     email_contato,
    //     telefone_contato,
    //     logo_url,        // opcional - string com URL
    //     nuvem_index_url  // opcional - string com URL
    //   }
    // }
    // ----------------------------------------------------------
    if (acao === "salvar_config_site") {
      const { id, dados = {} } = req.body || {};
      const fields = {};

      if (typeof dados.nome_ong === "string") {
        fields.nome_ong = dados.nome_ong;
      }
      if (typeof dados.descricao_homepage === "string") {
        fields.descricao_homepage = dados.descricao_homepage;
      }
      if (typeof dados.instagram_url === "string") {
        fields.instagram_url = dados.instagram_url;
      }
      if (typeof dados.email_contato === "string") {
        fields.email_contato = dados.email_contato;
      }
      if (typeof dados.telefone_contato === "string") {
        fields.telefone_contato = dados.telefone_contato;
      }

      // 🔥 IMAGENS COMO ATTACHMENT
      if (dados.logo_url) {
        fields.logo_header = [{ url: dados.logo_url }];
      }
      if (dados.nuvem_index_url) {
        fields.nuvem_index = [{ url: dados.nuvem_index_url }];
      }

      fields.updated_at = new Date().toISOString();

      let recordId = id;

      if (recordId) {
        await base(configTable).update([{ id: recordId, fields }]);
      } else {
        const novo = await base(configTable).create([{ fields }]);
        recordId = novo[0].id;
      }

      return ok(res, { sucesso: true, id: recordId });
    }

    // ----------------------------------------------------------
    // 🆕 EVENTO — CRIAR
    // ----------------------------------------------------------
    if (acao === "criar") {
      const novo = await base(eventosTable).create([{ fields: req.body }]);
      return ok(res, { sucesso: true, id: novo[0].id });
    }

    // ----------------------------------------------------------
    // ✏️ EVENTO — ATUALIZAR
    // ----------------------------------------------------------
    if (acao === "atualizar") {
      const { id_evento, fields } = req.body;

      if (!id_evento || !fields) {
        return err(res, 400, "Dados insuficientes.");
      }

      await base(eventosTable).update([{ id: id_evento, fields }]);
      return ok(res, { sucesso: true });
    }

    // ----------------------------------------------------------
    // 🗑️ EVENTO — EXCLUIR
    // ----------------------------------------------------------
    if (acao === "excluir") {
      const { id_evento } = req.body;

      if (!id_evento) {
        return err(res, 400, "id_evento ausente.");
      }

      await base(eventosTable).destroy([id_evento]);
      return ok(res, { sucesso: true });
    }

    return err(res, 400, "Ação inválida.");
  } catch (e) {
    console.error("Erro /api/admin:", e);
    return err(res, 500, e.message);
  }
}
