// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js 
// ============================================================
// 🔹 OBJETIVO DESTA API:
//      Disponibiliza TODOS os eventos cadastrados no Airtable,
//      juntamente com as configurações do site (logo, nuvem etc.),
//      para consumo pelo site público e pelo painel administrativo.
//
// 🔹 MELHORIAS REALIZADAS :
//    ✔ Remoção de .all() — causava TRAVAMENTOS (timeout 300s no Vercel)
//    ✔ Substituição por ".firstPage()", seguro, rápido e recomendado
//    ✔ Mapeamento de attachments (Cloudinary)
//    ✔ Filtros inteligentes para cada tipo de listagem (home/admin/site)
//    ✔ Tratamento de erros robusto (JSON explicativo)
// 
// 🔹 POR QUE ESSA API É IMPORTANTE
//      - Carrega os eventos que aparecem no site.
//      - Carrega as imagens (Cloudinary) usadas no front-end.
//      - Carrega a configuração visual do projeto (config_site).
//      - É a API MAIS ACESSADA DO SISTEMA (Home → Eventos).
//
// 🔹 TABELAS UTILIZADAS:
//      🗂 eventos
//      🗂 config_site
//
// 🔹 CAMPOS USADOS NOS EVENTOS:
//      - id_evento (autonumber)
//      - nome_evento
//      - descricao
//      - local_evento
//      - data_evento
//      - data_realizacao_evento
//      - status_evento
//      - destacar_na_homepage
//      - imagem (attachment Cloudinary)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ------------------------------------------------------------
// 📡 Conexão com Airtable — com validação de ambiente
// ------------------------------------------------------------
function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  // 🛑 Erro explicativo caso o Vercel esteja sem credencial
  if (!apiKey || !baseId) {
    throw new Error("❌ Credenciais do Airtable ausentes no ambiente.");
  }

  const base = new Airtable({ apiKey }).base(baseId);

  return {
    base,
    eventosTable: process.env.AIRTABLE_EVENTOS_TABLE || "eventos",
    configTable:  process.env.AIRTABLE_CONFIG_SITE_TABLE || "config_site"
  };
}

// ------------------------------------------------------------
// 🟦 Mapeamento da tabela config_site
// ------------------------------------------------------------
// 🔹 Converte attachments em URL pura
// 🔹 Evita que o front quebre caso algum campo esteja vazio
function mapConfig(fields) {
  if (!fields) return null;

  return {
    nome_ong: fields.nome_ong || "",
    instagram_url: fields.instagram_url || "",
    descricao_homepage: fields.descricao_homepage || "",
    email_contato: fields.email_contato || "",
    telefone_contato: fields.telefone_contato || "",

    logo_header:
      Array.isArray(fields.logo_header) ? fields.logo_header[0]?.url || "" : "",

    nuvem_footer:
      Array.isArray(fields.nuvem_footer) ? fields.nuvem_footer[0]?.url || "" : "",
  };
}

// ------------------------------------------------------------
// 🟦 Mapeamento do evento
// ------------------------------------------------------------
function mapEvento(rec) {
  const f = rec.fields || {};

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

    // 🔥 Mapeamento inteligente de imagens (Cloudinary)
    imagem: Array.isArray(f.imagem)
      ? f.imagem.map(img => ({
          url: img.url,
          filename: img.filename,
          width: img.width,
          height: img.height
        }))
      : [],

    // Relacionamentos caso existam
    cartinhas: Array.isArray(f.cartinha) ? f.cartinha : [],
    adocoes: Array.isArray(f.adocoes) ? f.adocoes : [],
  };
}

// ============================================================================
// 🚀 HANDLER PRINCIPAL
// ============================================================================
export default async function handler(req, res) {

  // Configuração básica de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {

    // Conexão
    const { base, eventosTable, configTable } = getAirtable();
    const { tipo = "", status = "" } = req.query;

    // ============================================================
    // 1️⃣ CONFIG_SITE — Sem token (para home e layout do site)
    // ============================================================
    if (tipo === "site") {

      const registros = await base(configTable)
        .select({ maxRecords: 1 })
        .firstPage();   // ← seguro

      const rec = registros[0] || null;

      return res.status(200).json({
        sucesso: true,
        config: rec ? mapConfig(rec.fields) : null
      });
    }

    // ============================================================
    // 2️⃣ EVENTOS — Filtragem Inteligente por Tipo/Status
    // ============================================================
    let filtroFormula = "";

    // Eventos exibidos na home
    if (tipo === "home") {
      filtroFormula =
        "AND({destacar_na_homepage}=1, {status_evento}='em andamento')";
    }

    // Painel administrativo
    else if (tipo === "admin") {
      filtroFormula = "{status_evento}='em andamento'";
    }

    // Filtro por status público
    else if (status) {
      const valid = ["em andamento", "proximo", "encerrado"];
      if (valid.includes(status.toLowerCase())) {
        filtroFormula = `{status_evento}='${status}'`;
      }
    }

    // Seleção segura
    const selectConfig = {
      pageSize: 100, // ← garante performance (não limita o sistema)
      sort: [{ field: "data_evento", direction: "asc" }]
    };

    if (filtroFormula) {
      selectConfig.filterByFormula = filtroFormula;
    }

    // 🔥 Uso do firstPage → evita travamentos
    const registros = await base(eventosTable)
      .select(selectConfig)
      .firstPage();

    // Mapeamento dos eventos
    const eventos = registros.map(mapEvento);

    // Retorno final
    return res.status(200).json({
      sucesso: true,
      total: eventos.length,
      eventos
    });

  } catch (e) {

    console.error("🔥 Erro /api/eventos:", e);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar eventos/configuração.",
      detalhe: e.message
    });
  }
}
