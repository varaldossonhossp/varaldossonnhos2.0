// ============================================================
// 💙 VARAL DOS SONHOS — js/galeria.js
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".carrossel-eventos");
  if (!container) return;

  try {
    const resposta = await fetch("/api/eventos");
    const dados = await resposta.json();

    if (!dados.sucesso || !dados.eventos.length) {
      container.innerHTML = "<p>Nenhum evento disponível.</p>";
      return;
    }

    const slidesHTML = dados.eventos
      .map(
        (evento) => `
          <div class="slide">
            <img src="${evento.imagens[0]}" alt="${evento.titulo}">
            <div class="info">
              <h3>${evento.titulo}</h3>
              <p>${evento.descricao}</p>
              <small>${new Date(evento.data_evento).toLocaleDateString("pt-BR")}</small>
            </div>
          </div>
        `
      )
      .join("");

    container.innerHTML = `
      <div class="carrossel">
        ${slidesHTML}
      </div>
    `;

    // Efeito de rotação automática
    let indice = 0;
    const slides = container.querySelectorAll(".slide");

    function mostrarSlide() {
      slides.forEach((s, i) => (s.style.display = i === indice ? "block" : "none"));
      indice = (indice + 1) % slides.length;
    }

    mostrarSlide();
    setInterval(mostrarSlide, 4000);
  } catch (erro) {
    console.error("Erro ao carregar eventos:", erro);
  }
});
