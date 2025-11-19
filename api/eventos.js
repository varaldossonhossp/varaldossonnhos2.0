// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js (versão final TCC)
// ------------------------------------------------------------
// ✔ Retorna todos os eventos
// 🔹 Finalidade da API:
//     - Fornecer dados de EVENTOS para o site público
//       e para o painel administrativo.
//     - Retorna lista de eventos com filtros opcionais.
//     - Agora também retorna CONFIGURAÇÃO DO SITE
//       (logo, nuvem, instagram etc.) sem exigir token.
// 🔹 Operações implementadas:
//   • GET ?tipo=site
//        → retorna config_site (sem token)
//   • GET ?tipo=home
//        → retorna eventos destacados na homepage
//   • GET ?tipo=admin
//        → retorna eventos para o painel administrativo
//   • GET ?status=em andamento|proximo|encerrado
//        → filtra eventos por status
// 🔹 Tabelas utilizadas no Airtable:
//     🗂  Tabela: eventos
//     🗂  Tabela: config_site
// 🔹 Campos utilizados pela API (conforme Airtable):
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
// 🔹 Alterações recentes:
//   • Refatoração completa do código para suportar
//     múltiplos tipos de resposta (eventos + config_site).
//  • Implementação de filtros por tipo e status.
//  • Melhoria no mapeamento dos campos de imagem.
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ============================================================
// 🔧 Conexão Airtable
// ============================================================
function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error("❌ Credenciais do Airtable ausentes.");
  }

  const base = new Airtable({ apiKey }).base(baseId);
  return {
    base,
    eventosTable: process.env.AIRTABLE_EVENTOS_TABLE || "eventos",
    configTable: process.env.AIRTABLE_CONFIG_SITE_TABLE || "config_site"
  };
}

// ============================================================
// 🟦 Mapeamento de evento (mantido)
// ============================================================
function mapEvento(rec) {
  const f = rec.fields || {};

  const imagem = Array.isArray(f.imagem)
    ? f.imagem.map(x => ({
        url: x.url,
        filename: x.filename,
        width: x.width,
        height: x.height
      }))
    : [];

  return {
    id: rec.id,
    id_evento: f.id_evento ?? null,
    nome_evento: f.nome_evento ?? "",
    descricao: f.descricao ?? "",
    local_evento: f.local_evento ?? "",
    data_evento: f.data_evento ?? null,
    data_limite_recebimento: f.data_limite_recebimento ?? null,
    data_realizacao_evento: f.data_realizacao_evento ?? null,
    status_evento: (f.status_evento || "").toLowerCase(),
    destacar_na_homepage: !!f.destacar_na_homepage,
    imagem,
    cartinhas: Array.isArray(f.cartinha) ? f.cartinha : [],
    adocoes: Array.isArray(f.adocoes) ? f.adocoes : []
  };
}

// ============================================================
// 🚀 Handler Principal
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const { base, eventosTable, configTable } = getAirtable();
    const { tipo = "", status = "" } = req.query;

    // ==========================================================
    // 📌 1 — CONFIGURAÇÃO DO SITE (sem token)
    // ==========================================================
    if (tipo === "site") {
      const registros = await base(configTable)
        .select({ maxRecords: 1 })
        .all();

      const rec = registros[0] || null;

      return res.status(200).json({
        sucesso: true,
        config: rec ? rec.fields : null
      });
    }

    // ==========================================================
    // 📌 2 — EVENTOS (comportamento original mantido)
    // ==========================================================
    let filtro = "";

    if (tipo === "home") {
      filtro = "AND({destacar_na_homepage}=1, {status_evento}='em andamento')";
    } else if (tipo === "admin") {
      filtro = "{status_evento}='em andamento'";
    } else if (status) {
      const allowed = ["em andamento", "proximo", "encerrado"];
      if (allowed.includes(status.toLowerCase())) {
        filtro = `{status_evento}='${status}'`;
      }
    }

    const selectConfig = {
      sort: [{ field: "data_evento", direction: "asc" }],
    };

    if (filtro) selectConfig.filterByFormula = filtro;

    const registros = await base(eventosTable).select(selectConfig).all();
    const eventos = registros.map(mapEvento);

    return res.status(200).json({
      sucesso: true,
      total: eventos.length,
      eventos
    });

  } catch (e) {
    console.error("🔥 Erro /api/eventos:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar eventos/config.",
      detalhe: e.message
    });
  }
}
