// ============================================================
// 💙 VARAL DOS SONHOS — js/galeria.js
// ------------------------------------------------------------
// Este script é responsável por:
//   ✅ Buscar os eventos ativos na tabela "eventos" do Airtable
//   ✅ Montar dinamicamente o carrossel na página inicial
//   ✅ Alternar automaticamente as imagens com transição suave
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  // Seleciona o container onde o carrossel será inserido
  const container = document.querySelector(".carrossel-eventos");
  if (!container) return;

  try {
    // ============================================================
    // 🔗 BUSCA OS DADOS DA API DE EVENTOS (VIA /api/eventos)
    // ------------------------------------------------------------
    // Esta rota lê diretamente a tabela "eventos" do Airtable.
    // O endpoint retorna JSON com: titulo, descricao, data, imagens[] e ativo.
    // ============================================================
    const resposta = await fetch("/api/eventos");
    const dados = await resposta.json();

    // Caso a resposta esteja vazia ou ocorra erro
    if (!dados.sucesso || !dados.eventos || dados.eventos.length === 0) {
      container.innerHTML = `
        <p style="text-align:center; color:#4A90E2;">
          Nenhum evento disponível no momento 💫
        </p>`;
      return;
    }

    // ============================================================
    // 🎨 MONTA O HTML DO CARROSSEL DINÂMICO
    // ------------------------------------------------------------
    // Cria slides com título, descrição e data formatada.
    // Usa apenas os eventos que possuem "ativo = true".
    // ============================================================
    const slidesHTML = dados.eventos
      .filter((evento) => evento.ativo)
      .map(
        (evento, index) => `
        <div class="slide" style="display:${index === 0 ? "block" : "none"}">
          <img src="${evento.imagens?.[0] || '/imagens/evento-padrao.jpg'}" alt="${evento.titulo}">
          <div class="info">
            <h3>${evento.titulo}</h3>
            <p>${evento.descricao || ""}</p>
            <small>${new Date(evento.data_evento).toLocaleDateString("pt-BR")}</small>
          </div>
        </div>
      `
      )
      .join("");

    // ============================================================
    // 🧩 INSERE O HTML DO CARROSSEL E OS CONTROLES
    // ============================================================
    container.innerHTML = `
      <div class="carrossel">
        ${slidesHTML}
        <button class="seta esquerda">&#10094;</button>
        <button class="seta direita">&#10095;</button>
      </div>
      <div class="bolinhas"></div>
    `;

    // ============================================================
    // ⚙️ CONFIGURAÇÃO DO CARROSSEL (NAVEGAÇÃO E AUTOPLAY)
    // ============================================================
    const slides = container.querySelectorAll(".slide");
    const bolinhasContainer = container.querySelector(".bolinhas");
    let indiceAtual = 0;
    let intervalo;

    // Cria as bolinhas (indicadores de posição)
    slides.forEach((_, i) => {
      const bolinha = document.createElement("span");
      bolinha.classList.add("bolinha");
      if (i === 0) bolinha.classList.add("ativa");
      bolinha.addEventListener("click", () => mostrarSlide(i));
      bolinhasContainer.appendChild(bolinha);
    });

    // Função para mostrar um slide específico
    function mostrarSlide(indice) {
      slides.forEach((s, i) => (s.style.display = i === indice ? "block" : "none"));
      const bolinhas = bolinhasContainer.querySelectorAll(".bolinha");
      bolinhas.forEach((b, i) => b.classList.toggle("ativa", i === indice));
      indiceAtual = indice;
    }

    // Funções para navegar entre slides
    function proximoSlide() {
      indiceAtual = (indiceAtual + 1) % slides.length;
      mostrarSlide(indiceAtual);
    }

    function slideAnterior() {
      indiceAtual = (indiceAtual - 1 + slides.length) % slides.length;
      mostrarSlide(indiceAtual);
    }

    // Liga os botões de navegação
    const setaEsquerda = container.querySelector(".seta.esquerda");
    const setaDireita = container.querySelector(".seta.direita");

    setaEsquerda.addEventListener("click", slideAnterior);
    setaDireita.addEventListener("click", proximoSlide);

    // Inicia o autoplay (troca de slide a cada 4s)
    function iniciarAutoPlay() {
      intervalo = setInterval(proximoSlide, 4000);
    }

    // Pausa o autoplay quando o mouse entra no carrossel
    function pausarAutoPlay() {
      clearInterval(intervalo);
    }

    // Aplica listeners
    container.addEventListener("mouseenter", pausarAutoPlay);
    container.addEventListener("mouseleave", iniciarAutoPlay);

    // Inicia o carrossel
    iniciarAutoPlay();
  } catch (erro) {
    console.error("❌ Erro ao carregar eventos do Airtable:", erro);
    container.innerHTML = `
      <p style="text-align:center; color:red;">
        Erro ao carregar os eventos. Tente novamente mais tarde.
      </p>`;
  }
});
