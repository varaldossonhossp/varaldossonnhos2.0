// ============================================================
// 💙 VARAL DOS SONHOS — config-site-apply.js (VERSÃO FINAL)
// ------------------------------------------------------------
// Este script:
// ✔ Carrega a configuração do Airtable
// ✔ Atualiza a logo em TODAS as páginas
// ✔ Atualiza nuvem em TODAS as páginas
// ✔ Atualiza relatórios, PDFs e telas internas
// ✔ Funciona mesmo quando o HEADER é carregado dinamicamente
// ============================================================

async function aplicarConfigSite() {
  try {
    const resp = await fetch("/api/admin?tipo=config_site");
    const json = await resp.json();

    if (!json.sucesso || !json.config) return;

    const cfg = json.config;

    // -------------------------------
    // LOGO
    // -------------------------------
    let logoUrl = "";
    if (Array.isArray(cfg.logo_header) && cfg.logo_header.length > 0) {
      logoUrl = cfg.logo_header[0].url;
    }

    if (logoUrl) {
      document.querySelectorAll(".logo-header").forEach((el) => {
        el.src = logoUrl;
      });

      // Relatórios / PDFs
      document.querySelectorAll("img[src*='logo.png'], img[src$='logo.png']").forEach(el => {
        el.src = logoUrl;
      });
    }

    // -------------------------------
    // NUVEM INDEX / OUTRAS PÁGINAS
    // -------------------------------
    let nuvemUrl = "";
    if (Array.isArray(cfg.nuvem_index) && cfg.nuvem_index.length > 0) {
      nuvemUrl = cfg.nuvem_index[0].url;
    }

    if (nuvemUrl) {
      document.querySelectorAll(".nuvem-index, img[src*='nuvem']").forEach((el) => {
        el.src = nuvemUrl;
      });

      // Compatível com como-funciona.html
      document.querySelectorAll(".cf-hero-img").forEach((el) => {
        el.src = nuvemUrl;
      });
    }

    // -------------------------------
    // INSTAGRAM
    // -------------------------------
    if (cfg.instagram_url) {
      document.querySelectorAll(".instagram-link").forEach((el) => {
        el.href = cfg.instagram_url;
      });
    }
  } catch (e) {
    console.error("⚠ Erro ao aplicar config site:", e);
  }
}

// Executa depois que TUDO carregar
document.addEventListener("DOMContentLoaded", aplicarConfigSite);
window.addEventListener("load", aplicarConfigSite);
