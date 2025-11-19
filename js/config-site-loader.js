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
    const r = await fetch("/api/admin?tipo=config_site");
    const json = await r.json();
    const cfg = json.config || {};

    if (cfg.logo_header){
      const el = document.querySelector(".logo-header");
      if (el) el.src = cfg.logo_header;
    }

    if (cfg.nuvem_footer){
      const el = document.querySelector(".footer-nuvem");
      if (el) el.src = cfg.nuvem_footer;
    }

    if (cfg.instagram_url){
      const el = document.querySelector(".instagram-link");
      if (el) el.href = cfg.instagram_url;
    }

  } catch (e){
    console.log("Erro ao carregar config:", e);
  }
});
