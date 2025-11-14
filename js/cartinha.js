// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinha-final.js
// Cards grandes, balanço, modal 60%
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  let cartinha = [];

  // ============================
  // 1) BUSCA API
  // ============================
  try {
    const resp = await fetch("/api/cartinha");
    if (!resp.ok) throw new Error("Erro ao buscar cartinhas");
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinha)) {
      trilho.innerHTML = "<p style='padding:20px;'>Nenhuma cartinha disponível 😢</p>";
      return;
    }

    cartinha = json.cartinha;
    montarVaral(cartinha);
  } catch (e) {
    console.error(e);
    trilho.innerHTML = "<p style='padding:20px;'>Erro ao carregar cartinhas.</p>";
  }

  // ============================
  // 2) MONTAR CARDS
  // ============================
  function montarVaral(lista) {
    trilho.innerHTML = "";

    lista.forEach(r => {
      const nome = r.primeiro_nome || "Criança";
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "Sonho não informado.";
      const irmaos = r.irmaos ?? 0;
      const idadeIrmaos = r.idade_irmaos || "—";

      const foto =
        Array.isArray(r.imagem_cartinha) && r.imagem_cartinha[0]
          ? r.imagem_cartinha[0].url
          : "../imagens/sem-foto.png";

      const gancho = document.createElement("div");
      gancho.className = "gancho";

      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <div class="cartinha-quadro" data-img="${foto}" data-nome="${nome}">
          <img src="${foto}" loading="lazy" />
        </div>

        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p><strong>Idade:</strong> ${idade} anos</p>
          <p><strong>Sonho:</strong> ${sonho}</p>
          <p><strong>Irmãos:</strong> ${irmaos}</p>
          <p><strong>Idade dos irmãos:</strong> ${idadeIrmaos}</p>
        </div>

        <button class="btn-adotar" data-id="${r.id}">
          💙 Adotar
        </button>
      `;

      // Botão
      const btn = card.querySelector(".btn-adotar");
      if (estaNoCarrinho(r.id)) {
        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
      }

      btn.addEventListener("click", () => {
        adicionarAoCarrinho({ id: r.id, fields: r }, btn, nome);
      });

      // Zoom da imagem
      card.querySelector(".cartinha-quadro").addEventListener("click", (e) => {
        abrirZoom(e.currentTarget.dataset.img, nome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // ============================
  // 3) CARRINHO
  // ============================
  function estaNoCarrinho(id) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return carrinho.some(i => i.id === id);
  }

  function adicionarAoCarrinho(item, btn, nome) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    carrinho.push(item);
    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    btn.textContent = "No Carrinho 🧺";
    btn.classList.add("btn-ocupada");
    btn.disabled = true;

    alert(`💙 A cartinha de ${nome} foi adicionada ao carrinho!`);
  }

  // ============================
  // 4) MODAL ZOOM
  // ============================
  function abrirZoom(img, nome) {
    imgZoom.src = img;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }

  closeZoom.onclick = () => (modalZoom.style.display = "none");
  window.onclick = (e) => {
    if (e.target === modalZoom) modalZoom.style.display = "none";
  };

  // ============================
  // 5) SETAS
  // ============================
  const passo = 330;
  btnEsq.onclick = () => trilho.scrollBy({ left: -passo, behavior: "smooth" });
  btnDir.onclick = () => trilho.scrollBy({ left: passo, behavior: "smooth" });

});
