// ============================================================
// 💙 VARAL DOS SONHOS — js/componentes.js
// Carrega dinamicamente header, footer e cloudinho
// ============================================================

async function carregarComponente(id, arquivo) {
  try {
    // Caminho absoluto (funciona em / e /pages/)
    const resp = await fetch(`/componentes/${arquivo}`);
    if (!resp.ok) throw new Error(`Erro ao carregar ${arquivo}`);

    const html = await resp.text();
    const elemento = document.getElementById(id);

    if (elemento) elemento.innerHTML = html;
    else console.warn(`Elemento com id "${id}" não encontrado no DOM.`);
  } catch (erro) {
    console.error("Erro ao carregar componente:", erro);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarComponente("header", "header.html");
  carregarComponente("footer", "footer.html");
  carregarComponente("cloudinho", "cloudinho.html");
});
