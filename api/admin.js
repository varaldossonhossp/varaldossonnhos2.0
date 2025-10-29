// ============================================================
// 💼 VARAL DOS SONHOS — /api/admin.js (Airtable + Vercel)
// ============================================================
import Airtable from "airtable";

export const config = { runtime: "nodejs" };

const ok = (res, data) => res.status(200).json(data);
const err = (res, code, msg) => res.status(code).json({ sucesso: false, mensagem: msg });

function getToken(req) {
  return (
    req.headers["x-admin-token"] ||
    req.query.token_admin ||
    (req.body && req.body.token_admin) ||
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

function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  // Define a tabela principal como 'eventos' para esta API
  const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos"; 
  if (!apiKey || !baseId) throw new Error("Chaves do Airtable ausentes.");
  const base = new Airtable({ apiKey }).base(baseId);
  return { base, table };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");
  if (req.method === "OPTIONS") return res.status(204).end();

  const auth = requireAuth(req, res);
  if (auth !== true) return;

  const { base, table } = getAirtable();

  try {
    if (req.method === "GET") {
      const { tipo } = req.query;
      if (tipo !== "eventos") return err(res, 400, "Tipo inválido.");

      const registros = await base(table).select().all();
      return ok(res, { sucesso: true, eventos: registros });
    }

    if (req.method === "POST") {
      const { acao, id_evento, fields } = req.body || {};

      // Ação: criar — mapeia diretamente os campos da tabela
      if (acao === "criar") {
        const {
          nome_evento,
          local_evento,
          descricao,
          data_evento,
          data_limite_recebimento,
          destacar_na_homepage,
          imagem, // [{url}]
        } = req.body || {};

        const newFields = {
          nome_evento,
          local_evento,
          descricao,
          data_evento: data_evento || null,
          data_limite_recebimento: data_limite_recebimento || null,
          destacar_na_homepage: !!destacar_na_homepage,
          // Airtable espera o anexo como [{ url: "..." }]
          imagem: Array.isArray(imagem) ? imagem : [], 
          status_evento: "em andamento",
          ativo: true, // Campo auxiliar para controle
        };

        const created = await base(table).create([{ fields: newFields }]);
        return ok(res, { sucesso: true, id: created[0].id });
      }

      // Ação: atualizar — permite atualizar qualquer subconjunto de campos
      if (acao === "atualizar") {
        if (!id_evento) return err(res, 400, "id_evento ausente.");
        if (!fields || typeof fields !== "object") return err(res, 400, "fields ausente/ inválido.");

        await base(table).update([{ id: id_evento, fields }]);
        return ok(res, { sucesso: true });
      }

      // Ação: excluir
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