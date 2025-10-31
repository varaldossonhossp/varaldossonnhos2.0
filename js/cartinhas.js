// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js (corrigido: prendedor.png)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  // Modal Zoom
  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  let cartinhas = [];

  // 1) API
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

  // 2) Montagem dos cards
  function montarVaral(registros) {
    trilho.innerHTML = "";

    registros.forEach((r) => {
      const nome = (r.primeiro_nome || "").trim() || "Criança";
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "Sonho não especificado.";
      const irmaos = r.irmaos ?? "—";
      const idadeIrmaos = r.idade_irmaos ?? "—";

      const foto =
        Array.isArray(r.imagem_cartinha) && r.imagem_cartinha[0]
          ? r.imagem_cartinha[0].url
          : "../imagens/sem-foto.png";

      const gancho = document.createElement("div");
      gancho.className = "gancho"; // o prendedor vem do CSS ::before

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
      const cartItem = { id: r.id, id_cartinha: r.id_cartinha, fields: r };

      if (estaNoCarrinho(r.id)) {
        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
      }

      btn.addEventListener("click", () => {
        adicionarAoCarrinho(cartItem, btn, nome);
      });

      card.querySelector(".cartinha-quadro").addEventListener("click", (e) => {
        abrirModalZoom(e.currentTarget.dataset.img, e.currentTarget.dataset.nome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // 3) Helpers
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

  // 4) Zoom
  function abrirModalZoom(imgUrl, nome) {
    imgZoom.src = imgUrl;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }
  closeZoom.onclick = () => (modalZoom.style.display = "none");
  window.onclick = (e) => { if (e.target === modalZoom) modalZoom.style.display = "none"; };

  // 5) Carrossel
  const passo = 320;
  btnEsq.addEventListener("click", () => trilho.scrollBy({ left: -passo, behavior: "smooth" }));
  btnDir.addEventListener("click", () => trilho.scrollBy({ left:  passo, behavior: "smooth" }));
});
