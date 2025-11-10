// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js (versão unificada final)
// ------------------------------------------------------------
// 🔹 Compatível com a página eventos.html (Varal dos Sonhos)
// 🔹 Unifica as versões "TCC" + "eventos-page"
// 🔹 Suporte a ?status=... | ?tipo=home|admin|all
// 🔹 Retorna todos os campos, incluindo contadores e imagens
// 🔹 100% compatível com Airtable + Vercel
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// ============================================================
// 📦 Funções utilitárias
// ============================================================
const ok = (res, data) => res.status(200).json(data);
const err = (res, code, msg, detalhe) =>
  res.status(code).json({ sucesso: false, mensagem: msg, detalhe });

function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";
  if (!apiKey || !baseId)
    throw new Error("Credenciais Airtable ausentes. Verifique as variáveis de ambiente.");
  const base = new Airtable({ apiKey }).base(baseId);
  return { base, table };
}

// converte campos numéricos ou arrays em inteiros seguros
function toIntSafe(v) {
  if (v == null) return 0;
  if (Array.isArray(v)) return v.length;
  const n = parseInt(`${v}`.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}
function pick(...vals) {
  for (const v of vals) if (v !== undefined) return v;
  return undefined;
}

// ============================================================
// 🧩 Mapeamento dos campos da tabela "eventos"
// ============================================================
function mapEvento(rec) {
  const f = rec.fields || {};

  // imagens
  const imagem = Array.isArray(f.imagem)
    ? f.imagem.map((x) => ({
        url: x.url,
        filename: x.filename,
        width: x.width,
        height: x.height,
      }))
    : [];

  // status e campos básicos
  const statusRaw = (f.status_evento || "").toString().toLowerCase();

  // contadores (cartinhas / adoções)
  const cartinhas_total = toIntSafe(
    pick(f.cartinhas_total, f.cartinha, f.cartinhas, f.qtd_cartinhas, f.qtd_cartinha)
  );
  const adocoes_total = toIntSafe(
    pick(f.adocoes_total, f.adocoes, f.adoções, f.qtd_adocoes, f.qtd_adoções)
  );

  return {
    id: rec.id,
    id_evento: f.id_evento ?? null, // autonumber
    nome_evento: f.nome_evento ?? "",
    descricao: f.descricao ?? "",
    local_evento: f.local_evento ?? "",
    data_evento: f.data_evento ?? null, // início das adoções
    data_limite_recebimento: f.data_limite_recebimento ?? null,
    data_realizacao_evento: f.data_realizacao_evento ?? null, // data do evento
    status_evento: statusRaw,
    destacar_na_homepage: !!f.destacar_na_homepage,
    imagem,
    cartinhas_total,
    adocoes_total,
    cartinhas: Array.isArray(f.cartinha) ? f.cartinha : [],
    adocoes: Array.isArray(f.adocoes) ? f.adocoes : [],
  };
}

// ============================================================
// 🚀 Handler principal
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const { base, table } = getAirtable();

    const { tipo = "", status = "" } = req.query;
    let filtro = "";

    // ------------------------------------------------------------
    // 🔹 Compatível com ?tipo=home|admin|all (versão TCC)
    // 🔹 Compatível com ?status=em andamento|proximo|encerrado (página HTML)
    // ------------------------------------------------------------
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
      pageSize: 50,
    };
    if (filtro) selectConfig.filterByFormula = filtro;

    // ------------------------------------------------------------
    // 🔹 Busca no Airtable
    // ------------------------------------------------------------
    const registros = await base(table).select(selectConfig).all();
    const eventos = registros.map(mapEvento);

    // ------------------------------------------------------------
    // 🔹 Resposta padronizada
    // ------------------------------------------------------------
    ok(res, { sucesso: true, total: eventos.length, eventos });
  } catch (e) {
    console.error("🔥 Erro /api/eventos:", e);
    err(res, 500, "Erro ao listar eventos.", e?.message || e?.toString());
  }
}
