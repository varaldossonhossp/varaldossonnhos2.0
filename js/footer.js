// ============================================================
// 💙 VARAL DOS SONHOS — /js/footer.js
// ------------------------------------------------------------
// Função: carregar o rodapé global em todas as páginas
// Estrutura padrão no arquivo /componentes/footer.html
// e atualização automática do ano.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const footer = document.getElementById("footer");

  if (!footer) {
    console.warn("⚠️ Elemento #footer não encontrado na página.");
    return;
  }

  try {
    // ============================================================
    // 1️⃣ Busca o conteúdo do componente /componentes/footer.html
    // ============================================================
    const resposta = await fetch("/componentes/footer.html");

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar o footer.html");
    }

    const html = await resposta.text();
    footer.innerHTML = html;

    // ============================================================
    // 2️⃣ Atualiza automaticamente o ano corrente no rodapé
    // ============================================================
    const spanAno = footer.querySelector("#anoAtual");
    if (spanAno) {
      spanAno.textContent = new Date().getFullYear();
    }

    // ============================================================
    // 3️⃣ Link do Instagram (caso precise de ação personalizada)
    // ============================================================
    const instaLink = footer.querySelector("#linkInstagram");
    if (instaLink) {
      instaLink.addEventListener("click", () => {
        window.open("https://www.instagram.com/fantasticafabricadosonhos", "_blank");
      });
    }

  } catch (erro) {
    console.error("❌ Erro ao carregar o rodapé:", erro);
    footer.innerHTML = `
      <footer style="background:#4A90E2;color:white;text-align:center;padding:10px;">
        <p>© ${new Date().getFullYear()} Fantástica Fábrica de Sonhos 💙</p>
      </footer>
    `;
  }
});
