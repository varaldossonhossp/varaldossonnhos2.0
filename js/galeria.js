// ============================================================
// 💙 VARAL DOS SONHOS — /js/galeria.js
// ------------------------------------------------------------
// Função: carregar imagens da galeria de eventos e montar
// o carrossel automático da página inicial.
// ------------------------------------------------------------
// Origem dos dados:
//   • API: /api/admin?modo=galeria
//   • Tabela no Airtable: “galeria”
// Campos esperados no Airtable:
//   - titulo (texto)
//   - imagens (array [{ url }])
//   - ativo (checkbox)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("carrossel-eventos");
  if (!container) return;

  try {
    // ============================================================
    // 🔄 1️⃣ Busca os dados do Airtable via API Admin
    // ============================================================
    const resposta = await fetch("/api/admin?modo=galeria");
    const data = await resposta.json();

    if (!data.sucesso || !data.galeria || data.galeria.length === 0) {
      console.warn("Nenhuma imagem ativa encontrada no Airtable.");
      carregarFallback(container);
      return;
    }

    // ============================================================
    // 🖼️ 2️⃣ Monta os slides dinamicamente
    // ============================================================
    container.innerHTML = ""; // Limpa o conteúdo inicial

    data.galeria.forEach((registro) => {
      if (registro.fields.ativo && registro.fields.imagens) {
        registro.fields.imagens.forEach((img) => {
          const slide = document.createElement("div");
          slide.className = "slide fade";

          const imagem = document.createElement("img");
          imagem.src = img.url;
          imagem.alt = registro.fields.titulo || "Momento especial";

          slide.appendChild(imagem);
          container.appendChild(slide);
        });
      }
    });

    // ============================================================
    // 🎠 3️⃣ Inicializa o carrossel automático
    // ============================================================
    iniciarCarrossel(container);
  } catch (erro) {
    console.error("Erro ao carregar galeria:", erro);
    carregarFallback(container);
  }
});

// ============================================================
// 🩵 4️⃣ Fallback local — se o Airtable estiver fora do ar
// ============================================================
function carregarFallback(container) {
  container.innerHTML = `
    <div class="slide fade"><img src="/imagens/evento1.jpg" alt="Evento local 1"></div>
    <div class="slide fade"><img src="/imagens/evento2.jpg" alt="Evento local 2"></div>
    <div class="slide fade"><img src="/imagens/evento3.jpg" alt="Evento local 3"></div>
  `;
  iniciarCarrossel(container);
}

// ============================================================
// 🎞️ 5️⃣ Função para rotacionar slides automaticamente
// ============================================================
function iniciarCarrossel(container) {
  const slides = container.getElementsByClassName("slide");
  if (slides.length === 0) return;

  let indice = 0;
  exibirSlide(indice);

  setInterval(() => {
    slides[indice].style.display = "none";
    indice = (indice + 1) % slides.length;
    exibirSlide(indice);
  }, 4000); // muda de slide a cada 4s

  function exibirSlide(i) {
    slides[i].style.display = "block";
    slides[i].classList.add("fade");
  }
}
