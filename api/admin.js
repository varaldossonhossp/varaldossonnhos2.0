// ============================================================
// 💼 VARAL DOS SONHOS — /api/admin.js (versão TCC + eventos admin)
// ------------------------------------------------------------
// API segura para gerenciamento de EVENTOS (CRUD).
// Exige token administrativo (ADMIN_SECRET) configurado no Vercel.
//
// 🔹 Tabela: "eventos"
// 🔹 Campos usados atualmente:
//
//  - nome_evento            (Single line text)
//  - local_evento           (Single line text)
//  - descricao              (Long text)
//  - data_evento            (Date — início das adoções)
//  - data_limite_recebimento(Date — limite para receber presentes)
//  - data_realizacao_evento (Date — data do evento)
//  - status_evento          (Single select: "em andamento" | "proximo" | "encerrado")
//  - destacar_na_homepage   (Checkbox — destacar carrossel na home)
//  - imagem                 (Attachment[] — fotos do evento)
//  - ativo                  (Checkbox / Boolean — controle interno opcional)
//
// Esta API é usada pelo painel administrativo (ex: cadastroevento.html)
// e NÃO pela página pública de listagem (que usa /api/eventos.js).
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
