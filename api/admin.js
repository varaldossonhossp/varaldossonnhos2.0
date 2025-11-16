// ============================================================
// 📘 DOCUMENTAÇÃO TÉCNICA — /api/admin.js
// ============================================================
// 🔹 Finalidade da API:
//     - API administrativa (protegida por token) usada para
//       GERENCIAR EVENTOS do Varal dos Sonhos.
//     - Implementa CRUD completo (Criar, Listar, Atualizar, Excluir).
//     - É utilizada SOMENTE pelo painel administrativo.
//     - A página pública NÃO usa esta API.
//
// 🔹 Arquivos / Telas que consomem esta API:
//     - /pages/admin/cadastroevento.html
//     - /js/admin.js  (funções do painel)
//     - qualquer tela administrativa que edite eventos futuramente.
//
// 🔹 Tabela utilizada no Airtable:
//     🗂  Tabela: **eventos**
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
//     • GET    → listar todos os eventos
//     • POST   (acao === "criar")      → criar novo evento
//     • POST   (acao === "atualizar")  → atualizar campos parciais
//     • POST   (acao === "excluir")    → excluir evento
//
// 🔹 Variáveis de ambiente exigidas:
//     - ADMIN_SECRET             (token do administrador)
//     - AIRTABLE_API_KEY         (chave Airtable)
//     - AIRTABLE_BASE_ID         (base Airtable)
//     - AIRTABLE_EVENTOS_TABLE   (nome da tabela — opcional)
//
// 🔹 Regras de segurança:
//     - Toda requisição precisa do header:  x-admin-token: SEU_TOKEN
//     - Sem token válido → 401 Token inválido.
//
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
function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";
  if (!apiKey || !baseId) throw new Error("Chaves Airtable ausentes.");
  const base = new Airtable({ apiKey }).base(baseId);
  return { base, table };
}

// ============================================================
// 🧩 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");
  if (req.method === "OPTIONS") return res.status(204).end();

  const auth = requireAuth(req, res);
  if (auth !== true) return;

  const { base, table } = getAirtable();

  try {
    // ============================================================
    // 📋 GET — Lista todos os eventos (retorna registros Airtable)
    // ============================================================
    if (req.method === "GET") {
      const registros = await base(table).select().all();
      return ok(res, { sucesso: true, eventos: registros });
    }

    // ============================================================
    // 🆕 POST — Criação / Atualização / Exclusão
    // ============================================================
    if (req.method === "POST") {
      const { acao, id_evento, fields } = req.body || {};

      // ----------------------------------------------------------
      // 🆕 Criar novo evento
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
        } = req.body;

        const novo = await base(table).create([
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
      // ✏️ Atualizar evento existente
      //   - "fields" vem direto do front (campos parciais)
// ----------------------------------------------------------
      if (acao === "atualizar") {
        if (!id_evento || !fields)
          return err(res, 400, "Dados insuficientes.");

        await base(table).update([{ id: id_evento, fields }]);
        return ok(res, { sucesso: true });
      }

      // ----------------------------------------------------------
      // 🗑️ Excluir evento
      // ----------------------------------------------------------
      if (acao === "excluir") {
        if (!id_evento) return err(res, 400, "id_evento ausente.");
        await base(table).destroy([id_evento]);
        return ok(res, { sucesso: true });
      }

      return err(res, 400, "Ação inválida.");
    }

    return err(res, 405, "Método não suportado.");
  } catch (e) {
    console.error("Erro /api/admin:", e);
    return err(res, 500, e.message || "Erro interno.");
  }
}
