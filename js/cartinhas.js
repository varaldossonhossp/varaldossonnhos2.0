// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js (versão final revisada)
// ------------------------------------------------------------
// Exibe cartinhas em cards pendurados, com carrossel horizontal,
// botão de adoção e modal de zoom funcional.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  // 🎞️ Modal de Zoom
  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  let cartinhas = [];

  // ============================================================
  // 1️⃣ BUSCAR DADOS DA API
  // ============================================================
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

  // ============================================================
  // 2️⃣ MONTAR OS CARDS DO VARAL
  // ============================================================
  function montarVaral(registros) {
    trilho.innerHTML = "";

    registros.forEach((r) => {
      const nome = (r.primeiro_nome || "").trim() || "Criança";
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "Sonho não especificado.";
      const irmaos = r.irmaos || "0";
      const idadeIrmaos = r.idade_irmaos || "—";
      const status = r.status?.toLowerCase() || "disponível";

      const foto =
        Array.isArray(r.imagem_cartinha) && r.imagem_cartinha[0]
          ? r.imagem_cartinha[0].url
          : "../imagens/sem-foto.png";

      // Criar o gancho e o card
      const gancho = document.createElement("div");
      gancho.className = "gancho";

      const card = document.createElement("div");
      card.className = "card-cartinha";

      // Estrutura visual do card
      card.innerHTML = `
        <div class="cartinha-quadro" data-img="${foto}" data-nome="${nome}">
          <img src="${foto}" alt="Cartinha de ${nome}" />
        </div>

        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p><strong>Idade:</strong> ${idade} anos</p>
          <p><strong>Sonho:</strong> ${sonho}</p>
          <p><strong>Irmãos:</strong> ${irmaos}</p>
          <p><strong>Idade dos irmãos:</strong> ${idadeIrmaos}</p>
        </div>

        <button class="btn-adotar ${status === "adotada" ? "btn-ocupada" : ""}"
          data-id="${r.id}"
          ${status === "adotada" ? "disabled" : ""}>
          ${status === "adotada" ? "Adotada 💝" : "💙 Adotar"}
        </button>
      `;

      // ========================================================
      // 🧺 Adicionar ao Carrinho
      // ========================================================
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

      // ========================================================
      // 🔍 Zoom da Cartinha
      // ========================================================
      const quadro = card.querySelector(".cartinha-quadro");
      quadro.addEventListener("click", (e) => {
        const imgUrl = e.currentTarget.dataset.img;
        const criancaNome = e.currentTarget.dataset.nome;
        abrirModalZoom(imgUrl, criancaNome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // ============================================================
  // 3️⃣ FUNÇÕES AUXILIARES (CARRINHO E ZOOM)
  // ============================================================
  function estaNoCarrinho(id) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return carrinho.some((item) => item.id === id);
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

  // ============================================================
  // 4️⃣ MODAL DE ZOOM
  // ============================================================
  function abrirModalZoom(imgUrl, nome) {
    imgZoom.src = imgUrl;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }

  closeZoom.onclick = () => (modalZoom.style.display = "none");
  window.onclick = (event) => {
    if (event.target === modalZoom) modalZoom.style.display = "none";
  };

  // ============================================================
  // 5️⃣ CONTROLES DO CARROSSEL (4 CARTAS VISÍVEIS)
  // ============================================================
  const passo = 280; // ajusta conforme largura do card

  btnEsq.addEventListener("click", () => {
    trilho.scrollBy({ left: -passo, behavior: "smooth" });
  });

  btnDir.addEventListener("click", () => {
    trilho.scrollBy({ left: passo, behavior: "smooth" });
  });
});
