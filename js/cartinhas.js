// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js (versão final TCC)
// ------------------------------------------------------------
// Função: exibe as cartinhas disponíveis e gerencia o botão
// “Adotar” que adiciona a cartinha ao carrinho (localStorage).
// ------------------------------------------------------------
// Fluxo:
//   1️⃣ Busca cartinhas da API /api/cartinhas
//   2️⃣ Monta os cards no varal
//   3️⃣ Permite ampliar imagem (zoom)
//   4️⃣ Adiciona ao carrinho local (localStorage)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  // Modal de zoom da cartinha
  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  let cartinhas = [];

  // ============================================================
  // 1️⃣ Buscar cartinhas na API
  // ============================================================
  try {
    const resp = await fetch("/api/cartinhas");
    const json = await resp.json();

    if (!json.sucesso) throw new Error("Resposta inválida da API.");
    cartinhas = json.cartinhas;
    montarVaral(cartinhas);
  } catch (e) {
    console.error("❌ Erro ao carregar cartinhas:", e);
    trilho.innerHTML = "<p style='padding:20px;'>💔 Falha ao buscar cartinhas.</p>";
  }

  // ============================================================
  // 2️⃣ Monta os cards dinamicamente
  // ============================================================
  function montarVaral(lista) {
    trilho.innerHTML = "";
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    lista.forEach((r) => {
      const nome = r.primeiro_nome || r.nome_crianca || "Criança";
      const idade = r.idade || "—";
      const sonho = r.sonho || "Sonho não especificado.";
      const irmaos = r.irmaos || "—";
      const idadeIrmaos = r.idade_irmaos || "—";
      const foto = Array.isArray(r.imagem_cartinha) && r.imagem_cartinha[0]
        ? r.imagem_cartinha[0].url
        : "../imagens/sem-foto.png";

      const card = document.createElement("div");
      card.className = "card-cartinha";

      card.innerHTML = `
        <div class="cartinha-quadro" data-img="${foto}" data-nome="${nome}">
          <img src="${foto}" alt="Cartinha de ${nome}" loading="lazy" />
        </div>
        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p><strong>Idade:</strong> ${idade} anos</p>
          <p><strong>Sonho:</strong> ${sonho}</p>
          <p><strong>Irmãos:</strong> ${irmaos}</p>
          <p><strong>Idade dos irmãos:</strong> ${idadeIrmaos}</p>
        </div>
        <button class="btn-adotar" data-id="${r.id}">💙 Adotar</button>
      `;

      const btn = card.querySelector(".btn-adotar");
      const estaNoCarrinho = carrinho.some((i) => i.id === r.id);

      if (estaNoCarrinho) {
        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
      }

      // Clique no botão Adotar
      btn.addEventListener("click", () => {
        const item = {
          id: r.id,
          nome_crianca: nome,
          sonho,
          foto,
        };

        const atual = JSON.parse(localStorage.getItem("carrinho")) || [];
        atual.push(item);
        localStorage.setItem("carrinho", JSON.stringify(atual));

        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
        alert(`💙 A cartinha de ${nome} foi adicionada ao carrinho!`);
      });

      // Clique para ampliar imagem
      card.querySelector(".cartinha-quadro").addEventListener("click", (e) => {
        abrirModalZoom(e.currentTarget.dataset.img, e.currentTarget.dataset.nome);
      });

      trilho.appendChild(card);
    });
  }

  // ============================================================
  // 3️⃣ Zoom da cartinha
  // ============================================================
  function abrirModalZoom(imgUrl, nome) {
    imgZoom.src = imgUrl;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }
  closeZoom.onclick = () => (modalZoom.style.display = "none");
  window.onclick = (e) => {
    if (e.target === modalZoom) modalZoom.style.display = "none";
  };

  // ============================================================
  // 4️⃣ Navegação horizontal (carrossel)
  // ============================================================
  const passo = 320;
  btnEsq.addEventListener("click", () => trilho.scrollBy({ left: -passo, behavior: "smooth" }));
  btnDir.addEventListener("click", () => trilho.scrollBy({ left: passo, behavior: "smooth" }));
});
