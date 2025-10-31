// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js (versão final estilizada)
// ------------------------------------------------------------
// Lista cartinhas, exibe cards com estilo dos pontos de coleta,
// adiciona ao carrinho e permite zoom da imagem.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  // Elementos do Modal de Zoom
  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  let cartinhas = [];

  // 1️⃣ Buscar dados da API
  try {
    const resp = await fetch("/api/cartinhas");
    if (!resp.ok) throw new Error(`Erro de conexão: ${resp.status}`);
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinhas)) {
      trilho.innerHTML = "<p style='padding:20px;'>💔 Nenhuma cartinha disponível no momento.</p>";
      return;
    }

    cartinhas = json.cartinhas;
    montarVaral(cartinhas);
  } catch (e) {
    console.error("Erro ao carregar cartinhas:", e);
    trilho.innerHTML = "<p style='padding:20px;'>❌ Falha ao conectar com o servidor.</p>";
  }

  // 2️⃣ Montar cards no varal
  function montarVaral(registros) {
    trilho.innerHTML = "";

    registros.forEach((r) => {
      const nome = (r.primeiro_nome || "").trim() || "Criança";
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "Sonho não especificado.";

      const foto =
        Array.isArray(r.imagem_cartinha) && r.imagem_cartinha[0]
          ? r.imagem_cartinha[0].url
          : "../imagens/sem-foto.png";

      // Estrutura principal
      const gancho = document.createElement("div");
      gancho.className = "gancho";

      const card = document.createElement("div");
      card.className = "card-cartinha";

      // Layout inspirado nos pontos de coleta
      card.innerHTML = `
        <div class="cartinha-quadro" data-img="${foto}" data-nome="${nome}">
          <img src="${foto}" alt="Cartinha de ${nome}" />
        </div>

        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p><strong>Idade:</strong> ${idade} anos</p>
          <p><strong>Sonho:</strong> ${sonho}</p>
         

        </div>

        <button class="btn-adotar" data-id="${r.id}">💙 Adotar</button>
      `;

      // Função botão adotar
      const btn = card.querySelector(".btn-adotar");
      const cartItem = { id: r.id, id_cartinha: r.id_cartinha, fields: r };

      if (estaNoCarrinho(r.id)) {
        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
      }

      btn.addEventListener("click", () => {
        adicionarAoCarrinho(cartItem, btn, nome);
      });

      // Evento para abrir zoom da cartinha
      card.querySelector(".cartinha-quadro").addEventListener("click", (e) => {
        const imgUrl = e.currentTarget.dataset.img;
        const criancaNome = e.currentTarget.dataset.nome;
        abrirModalZoom(imgUrl, criancaNome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // 3️⃣ Funções auxiliares
  function estaNoCarrinho(id) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return !!carrinho.find((i) => i.id === id);
  }

  function adicionarAoCarrinho(item, botao, nome) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (!carrinho.find((i) => i.id === item.id)) {
      carrinho.push(item);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      botao.textContent = "No Carrinho 🧺";
      botao.classList.add("btn-ocupada");
      botao.disabled = true;
      alert(`💙 A cartinha de ${nome} foi adicionada ao carrinho!`);
    }
  }

  // 4️⃣ Modal de Zoom
  function abrirModalZoom(imgUrl, nome) {
    imgZoom.src = imgUrl;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }

  closeZoom.onclick = function () {
    modalZoom.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modalZoom) {
      modalZoom.style.display = "none";
    }
  };

  // 5️⃣ Controles do carrossel
  const passo = 300;
  btnEsq.addEventListener("click", () => {
    trilho.scrollBy({ left: -passo, behavior: "smooth" });
  });
  btnDir.addEventListener("click", () => {
    trilho.scrollBy({ left: passo, behavior: "smooth" });
  });
});
