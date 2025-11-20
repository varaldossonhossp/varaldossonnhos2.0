// ============================================================
// 🎨 VARAL DOS SONHOS — /js/config-site-loader.js (VERSÃO FINAL)
// ------------------------------------------------------------
// Este script carrega automaticamente as configurações globais
// do site a partir da tabela config_site no Airtable:
//
// • Logo do header                  → .logo-header
// • Nuvem animada do INDEX          → .nuvem-index
// • Link do Instagram               → .instagram-link
//
// Fonte dos dados:
//    GET /api/admin?tipo=config_site
// Tabela Airtable:
//   - config_site
//
// Os campos esperados no Airtable são:
//   - logo_header   (Attachment[])
//   - nuvem_index   (Attachment[])
//   - instagram_url (texto)
//   - nome_ong
//   - descricao_homepage
//   - email_contato
//   - telefone_contato
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ------------------------------------------------------------
    // Buscando configurações do site
    // ------------------------------------------------------------
    const resp = await fetch("/api/admin?tipo=config_site");
    const json = await resp.json();

    if (!json.sucesso || !json.config) {
      console.warn("⚠ Nenhuma configuração encontrada no config_site.");
      return;
    }

    const cfg = json.config;

    // ============================================================
    // LOGO HEADER
    // ============================================================
    let logoUrl = "";
    if (Array.isArray(cfg.logo_header) && cfg.logo_header.length > 0) {
      logoUrl = cfg.logo_header[0].url;
    }

    if (logoUrl) {
      document.querySelectorAll(".logo-header").forEach((el) => {
        el.src = logoUrl;
      });
    }

    // ============================================================
    // NUVEM DO INDEX
    // ============================================================
    let nuvemUrl = "";
    if (Array.isArray(cfg.nuvem_index) && cfg.nuvem_index.length > 0) {
      nuvemUrl = cfg.nuvem_index[0].url;
    }

    if (nuvemUrl) {
      document.querySelectorAll(".nuvem-index").forEach((el) => {
        el.src = nuvemUrl;
      });
    }

    // ============================================================
    // INSTAGRAM
    // ============================================================
    if (cfg.instagram_url) {
      document.querySelectorAll(".instagram-link").forEach((el) => {
        el.href = cfg.instagram_url;
      });
    }
  } catch (e) {
    console.error("⚠ Erro ao carregar configurações do site:", e);
  }
});
