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
// • Inclua este script na página pública (ex: index.html)
// • Certifique-se de que os elementos HTML tenham as classes:
//   - .logo-header       → Imagem do logo no header
//   - .footer-nuvem      → Imagem da nuvem no footer
//   - .instagram-link    → Link do Instagram
// Carregamento ao iniciar a página
// ============================================================ 

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const r = await fetch("/api/admin?tipo=config_site", {
      headers:{ "x-admin-token":"varaladmin" }
    });

    const json = await r.json();
    const cfg = json.config || {};

    // HEADER LOGO
    if (cfg.logo_header) {
      const headerLogo = document.querySelector(".logo-header");
      if (headerLogo) headerLogo.src = cfg.logo_header;
    }

    // FOOTER NUVEM
    if (cfg.nuvem_footer) {
      const nuvem = document.querySelector(".footer-nuvem");
      if (nuvem) nuvem.src = cfg.nuvem_footer;
    }

    // INSTAGRAM
    if (cfg.instagram_url) {
      const insta = document.querySelector(".instagram-link");
      if (insta) insta.href = cfg.instagram_url;
    }

  } catch (e) {
    console.log("Erro ao carregar config do site:", e);
  }
});
