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
    const r = await fetch("/api/eventos?tipo=site");
    const json = await r.json();
    const cfg = json.config || {};

    // LOGO HEADER
    if (cfg.logo_header) {
      document.querySelectorAll(".logo-header")
        .forEach(el => el.src = cfg.logo_header);
    }

    // NUVEM DO FOOTER + HOME
    if (cfg.nuvem_footer) {
      document.querySelectorAll(".footer-nuvem")
        .forEach(el => el.src = cfg.nuvem_footer);
    }

    // INSTAGRAM
    if (cfg.instagram_url) {
      document.querySelectorAll(".instagram-link")
        .forEach(el => el.href = cfg.instagram_url);
    }

  } catch (e) {
    console.log("Erro carregando config do site:", e);
  }
});
