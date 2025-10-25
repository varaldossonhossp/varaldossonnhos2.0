// ============================================================
// 💙 VARAL DOS SONHOS — js/carrossel.js
// ------------------------------------------------------------
// Carrega automaticamente as imagens da tabela "eventos"
// (campos: titulo, data_evento, descricao, imagem[], ativo)
// e exibe no carrossel da página inicial (index.html).
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const carrossel = document.querySelector(".carrossel");
  if (!carrossel) return;

  // Mensagem de carregamento inicial
  carrossel.innerHTML = `<p style="text-align:center; padding:20px;">⏳ Carregando eventos...</p>`;

  try {
    // Requisição à API (rota /api/admin cuidará da tabela eventos)
    const resposta = await fetch("/api/admin?tipo=eventos");
    const dados = await resposta.json();

    if (!dados.sucesso || !Array.isArray(dados.eventos)) {
      carrossel.innerHTML = `<p style="text-align:center; color:#555;">Nenhum evento disponível no momento 💙</p>`;
      return;
    }

    // Filtra apenas eventos ativos
    const eventos = dados.eventos.filter(e => e.fields.ativo);

    if (eventos.length === 0) {
      carrossel.innerHTML = `<p style="text-align:center; color:#555;">Nenhum evento ativo 💙</p>`;
      return;
    }

    // Cria os slides
    carrossel.innerHTML = "";
    eventos.forEach(evento => {
      const f = evento.fields;
      const imagens = f.imagem || [];
      const titulo = f.titulo || "Evento";
      const data = f.data_evento || "";
      const desc = f.descricao || "";

      // Se houver múltiplas imagens, gera um slide para cada uma
      imagens.forEach(img => {
        const slide = document.createElement("div");
        slide.className = "slide fade";
        slide.innerHTML = `
          <img src="${img.url}" alt="${titulo}">
          <div class="info">
            <h3>${titulo}</h3>
            <p>${desc || ""}</p>
            ${data ? `<small>📅 ${new Date(data).toLocaleDateString("pt-BR")}</small>` : ""}
          </div>
        `;
        carrossel.appendChild(slide);
      });
    });

    // Inicia o carrossel
    iniciarCarrossel();
  } catch (erro) {
    console.error("Erro ao carregar eventos:", erro);
    carrossel.innerHTML = `<p style="text-align:center; color:red;">Erro ao carregar eventos 😢</p>`;
  }

  // ============================================================
  // 🎞️ Função de animação automática do carrossel
  // ============================================================
  function iniciarCarrossel() {
    const slides = document.querySelectorAll(".carrossel .slide");
    if (slides.length === 0) return;

    let indice = 0;
    slides[indice].style.display = "block";

    setInterval(() => {
      slides[indice].style.display = "none";
      indice = (indice + 1) % slides.length;
      slides[indice].style.display = "block";
    }, 4000); // troca a cada 4 segundos
  }
});
