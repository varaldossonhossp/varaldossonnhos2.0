// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js (versão final TCC)
// ------------------------------------------------------------
// ✔ Retorna todos os eventos
// ✔ Campos usados pelo cadastro de cartinhas:
//      - nome_evento
//      - data_evento
//      - data_limite_recebimento
//      - data_realizacao_evento
// ✔ Mantém compatibilidade com:
//      /pages/eventos.html
//      carrossel da home
//      admin de eventos
// ✔ Sem quebra de código
// ============================================================

import Airtable from "airtable";

// ============================================================
// Vercel Runtime
// ============================================================
export const config = { runtime: "nodejs" };

// ============================================================
// 🔧 Inicialização Airtable
// ============================================================
function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";

  if (!apiKey || !baseId) {
    throw new Error("❌ Credenciais do Airtable ausentes.");
  }

  const base = new Airtable({ apiKey }).base(baseId);
  return { base, table };
}

// ============================================================
// 🧩 Mapeamento de campos do evento
// ------------------------------------------------------------
// Esta função transforma o registro bruto do Airtable
// em um formato limpo para o front-end.
// ============================================================
function mapEvento(rec) {
  const f = rec.fields || {};

  // ---- Imagens (Airtable attachment) ---
  const imagem = Array.isArray(f.imagem)
    ? f.imagem.map((x) => ({
        url: x.url,
        filename: x.filename,
        width: x.width,
        height: x.height,
      }))
    : [];

  return {
    id: rec.id,                         // ID do Airtable
    id_evento: f.id_evento ?? null,     // AutoNumber interno
    nome_evento: f.nome_evento ?? "",   // Nome do evento
    descricao: f.descricao ?? "",       // Descrição opcional
    local_evento: f.local_evento ?? "", // Local

    // ---- DATAS USADAS NO CADASTRO DE CARTINHA ----
    data_evento: f.data_evento ?? null, // Início das adoções
    data_limite_recebimento: f.data_limite_recebimento ?? null,
    data_realizacao_evento: f.data_realizacao_evento ?? null,

    // ---- Status ----
    status_evento: (f.status_evento || "").toString().toLowerCase(),

    // ---- Checkbox ----
    destacar_na_homepage: !!f.destacar_na_homepage,

    // ---- Imagem principal ----
    imagem,

    // ---- Campos de ligação ----
    cartinhas: Array.isArray(f.cartinha) ? f.cartinha : [],
    adocoes: Array.isArray(f.adocoes) ? f.adocoes : [],
  };
}

// ============================================================
// 🚀 Handler principal
// ------------------------------------------------------------
// Suporta filtros:
//   - ?tipo=home  → eventos destacados e em andamento
//   - ?tipo=admin → eventos em andamento (painel admin)
//   - ?status=proximo|em andamento|encerrado
// ============================================================
export default async function handler(req, res) {
  // ------ CORS ------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const { base, table } = getAirtable();

    const { tipo = "", status = "" } = req.query;
    let filtro = "";

    // ========================================================
    // 🔍 FILTROS DE EVENTOS (compatíveis com site atual)
    // ========================================================
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

    // ========================================================
    // 📌 Buscar eventos no Airtable
    // ========================================================
    const registros = await base(table).select(selectConfig).all();

    // ========================================================
    // 📌 Transformar formato cru → formato usado no site
    // ========================================================
    const eventos = registros.map(mapEvento);

    // ========================================================
    // 📌 Resposta final padronizada
    // ========================================================
    return res.status(200).json({
      sucesso: true,
      total: eventos.length,
      eventos,
    });

  } catch (e) {
    console.error("🔥 Erro /api/eventos:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar eventos.",
      detalhe: e.message || String(e),
    });
  }
}
