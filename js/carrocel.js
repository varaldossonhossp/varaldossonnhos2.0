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

  // Mensagem inicial
  carrossel.innerHTML = `<p style="text-align:center; padding:20px;">⏳ Carregando eventos...</p>`;

  try {
    // ============================================================
    // 🔗 Busca os eventos ativos via rota /api/admin
    // ============================================================
    const baseURL = window.location.hostname.includes("vercel.app")
      ? "/api/admin?tipo=eventos"
      : "http://localhost:3000/api/admin?tipo=eventos";

    const resposta = await fetch(baseURL);
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

    // ============================================================
    // 🖼️ Cria slides dinâmicos com base nas imagens do Airtable
    // ============================================================
    carrossel.innerHTML = "";
    eventos.forEach(evento => {
      const f = evento.fields;
      const imagens = f.imagem || [];
      const titulo = f.titulo || "Evento";
      const data = f.data_evento || "";
      const desc = f.descricao || "";

      imagens.forEach(img => {
        const slide = document.createElement("div");
        slide.className = "slide fade";
        slide.innerHTML = `
          <img src="${img.url}" alt="${titulo}">
          <div class="info">
            <h3>${titulo}</h3>
            <p>${desc}</p>
            ${data ? `<small>📅 ${new Date(data).toLocaleDateString("pt-BR")}</small>` : ""}
          </div>
        `;
        carrossel.appendChild(slide);
      });
    });

    iniciarCarrossel();
  } catch (erro) {
    console.error("❌ Erro ao carregar eventos:", erro);
    carrossel.innerHTML = `<p style="text-align:center; color:red;">Erro ao carregar eventos 😢</p>`;
  }

  // ============================================================
  // 🎞️ Controle automático do carrossel
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
    }, 4000);
  }
});
