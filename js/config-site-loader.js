// ============================================================
// 🎨 VARAL DOS SONHOS — /js/config-site-loader.js
// ------------------------------------------------------------
// Script para carregar configuração visual do site:
// • Logo do header (logo_header)
// • Nuvem animada do INDEX (nuvem_index)
// • Link do Instagram
//
// Dados vêm de:  GET /api/admin?tipo=config_site
// Tabela Airtable:
//   - config_site
// Campos importantes (Airtable):
//   - logo_header  (Attachment[])
//   - nuvem_index  (Attachment[])
//   - instagram_url (texto)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const resp = await fetch("/api/admin?tipo=config_site");
    const json = await resp.json();

    if (!json.sucesso || !json.config) {
      console.warn("Config do site não encontrada.");
      return;
    }

    const cfg = json.config;

    // --- Logo (attachment) ---
    const logoAtt = Array.isArray(cfg.logo_header) ? cfg.logo_header[0] : null;
    const logoUrl = logoAtt && logoAtt.url ? logoAtt.url : null;

    if (logoUrl) {
      document.querySelectorAll(".logo-header").forEach(el => {
        el.src = logoUrl;
      });
    }

    // --- Nuvem do INDEX (attachment nuvem_index) ---
    const nuvemAtt = Array.isArray(cfg.nuvem_index) ? cfg.nuvem_index[0] : null;
    const nuvemUrl = nuvemAtt && nuvemAtt.url ? nuvemAtt.url : null;

    if (nuvemUrl) {
      document.querySelectorAll(".nuvem-index").forEach(el => {
        el.src = nuvemUrl;
      });
    }

    // --- Instagram (texto normal) ---
    if (cfg.instagram_url) {
      document.querySelectorAll(".instagram-link").forEach(el => {
        el.href = cfg.instagram_url;
      });
    }
  } catch (e) {
    console.log("Erro carregando config do site:", e);
  }
});
