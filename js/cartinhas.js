// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js (versão final TCC)
// ------------------------------------------------------------
// Exibe o varal de cartinhas com prendedores, carrossel,
// botão de adoção e zoom da imagem.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");
  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  try {
    // 🔹 Busca cartinhas da API
    const resp = await fetch("/api/cartinhas");
    if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
    const json = await resp.json();

    if (!json.sucesso || !Array.isArray(json.cartinhas)) {
      trilho.innerHTML = "<p style='padding:20px;color:#c0392b;'>⚠️ Nenhuma cartinha disponível.</p>";
      return;
    }

    montarVaral(json.cartinhas);
  } catch (e) {
    trilho.innerHTML = "<p style='padding:20px;color:#c0392b;'>❌ Falha ao carregar cartinhas.</p>";
    console.error(e);
  }

  // ============================================================
  // 🧷 Monta o varal com os cards de cartinhas
  // ============================================================
  function montarVaral(registros) {
    trilho.innerHTML = "";
    registros.forEach(r => {
      const nome = r.primeiro_nome || "Criança";
      const idade = r.idade || "—";
      const sonho = r.sonho || "Sonho não informado";
      const irmaos = r.irmaos ? "Sim" : "Não";
      const idadeIrmaos = r.idade_irmaos || "—";
      const foto = (r.imagem_cartinha?.[0]?.url) || "/imagens/sem-foto.png";

      const gancho = document.createElement("div");
      gancho.className = "gancho";

      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <div class="cartinha-img-wrapper" data-img="${foto}" data-nome="${nome}">
          <img src="${foto}" alt="Cartinha de ${nome}">
        </div>
        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p>🎂 ${idade} anos</p>
          <p>💭 ${sonho}</p>
          ${irmaos === "Sim" ? `<p>Irmãos: ${irmaos} (${idadeIrmaos} anos)</p>` : ""}
        </div>
        <button class="btn-adotar" data-id="${r.id}">Adotar 💌</button>
      `;

      // 💙 Evento de adoção
      const btn = card.querySelector(".btn-adotar");
      const cartItem = { id: r.id, fields: r };
      if (estaNoCarrinho(r.id)) {
        btn.textContent = "No Carrinho 🧺";
        btn.disabled = true;
        btn.classList.add("btn-ocupada");
      }
      btn.addEventListener("click", () => adicionarAoCarrinho(cartItem, btn, nome));

      // 🔍 Evento de zoom
      card.querySelector(".cartinha-img-wrapper").addEventListener("click", e => {
        abrirModalZoom(e.currentTarget.dataset.img, e.currentTarget.dataset.nome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // ============================================================
  // 🧺 Carrinho (LocalStorage)
  // ============================================================
  function estaNoCarrinho(id) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return !!carrinho.find(i => i.id === id);
  }

  function adicionarAoCarrinho(item, botao, nome) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (!carrinho.find(i => i.id === item.id)) {
      carrinho.push(item);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      botao.textContent = "No Carrinho 🧺";
      botao.classList.add("btn-ocupada");
      botao.disabled = true;
      alert(`💙 A cartinha de ${nome} foi adicionada ao carrinho!`);
    }
  }

  // ============================================================
  // 🔍 Modal de Zoom
  // ============================================================
  function abrirModalZoom(imgUrl, nome) {
    imgZoom.src = imgUrl;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }

  closeZoom.onclick = () => modalZoom.style.display = "none";
  window.onclick = e => { if (e.target === modalZoom) modalZoom.style.display = "none"; };

  // ============================================================
  // 🎠 Navegação do carrossel
  // ============================================================
  const passo = 300;
  btnEsq.addEventListener("click", () => trilho.scrollBy({ left: -passo, behavior: "smooth" }));
  btnDir.addEventListener("click", () => trilho.scrollBy({ left: passo, behavior: "smooth" }));
});
