// ============================================================
// 🎨 VARAL DOS SONHOS — /js/config-site-loader.js
// ------------------------------------------------------------
// Script para carregar configuração visual do site:
// • Logo do header
// • Nuvem do footer
// • Link do Instagram
//
// Carrega configuração do site via API administrativa
// e atualiza os elementos visuais conforme definido.
// ============================================================
// Uso:
// • Este script deve estar na página pública (ex: index.html)
// • Certifique-se de que os elementos HTML tenham as classes:
//   - .logo-header       → Imagem do logo no header
//   - .footer-nuvem      → Imagem da nuvem no footer
//   - .instagram-link    → Link do Instagram
// Carregamento ao iniciar a página
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const r = await fetch("/api/admin?tipo=config_site");
    const json = await r.json();

    if (!json.sucesso || !json.config) return;

    const cfg = json.config;

    // ============================================================
    // 1) LOGO HEADER (attachment)
    // ============================================================
    if (Array.isArray(cfg.logo_header) && cfg.logo_header.length > 0) {
      const urlLogo = cfg.logo_header[0].url;

      document.querySelectorAll(".logo-header").forEach(el => {
        el.src = urlLogo;
      });
    }

    // ============================================================
    // 2) NUVEM FOOTER / HOME (attachment)
    // ============================================================
    if (Array.isArray(cfg.nuvem_footer) && cfg.nuvem_footer.length > 0) {
      const urlNuvem = cfg.nuvem_footer[0].url;

      document.querySelectorAll(".footer-nuvem").forEach(el => {
        el.src = urlNuvem;
      });
    }

    // ============================================================
    // 3) INSTAGRAM URL (texto)
    // ============================================================
    if (cfg.instagram_url) {
      document.querySelectorAll(".instagram-link").forEach(el => {
        el.href = cfg.instagram_url;
      });
    }

  } catch (e) {
    console.error("Erro ao carregar config do site:", e);
  }
});
