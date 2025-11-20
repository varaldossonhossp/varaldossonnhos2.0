// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinha.js 
// ------------------------------------------------------------
// Página do Varal Virtual:
// • Busca cartinhas disponíveis (status = disponivel)
// • Mostra no varal com scroll lateral
// • Carrinho com localStorage
// • Modal de zoom
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

  // ============================================================
  // 🔵 BUSCA API
  // ============================================================
  try {
    const resp = await fetch("/api/cartinha");
    if (!resp.ok) throw new Error("Erro ao buscar cartinhas");
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinha)) {
      trilho.innerHTML = "<p style='padding:20px;'>Nenhuma cartinha disponível 😢</p>";
      return;
    }

    // 🔥 FILTRA SOMENTE AS DISPONÍVEIS
    cartinha = json.cartinha.filter(c =>
      (c.status || "disponivel").toLowerCase() === "disponivel"
    );

    if (cartinha.length === 0) {
      trilho.innerHTML = "<p style='padding:20px;'>Nenhuma cartinha disponível 😢</p>";
      return;
    }

    montarVaral(cartinha);

  } catch (e) {
    console.error("Erro ao carregar cartinhas:", e);
    trilho.innerHTML = "<p style='padding:20px;'>Erro ao carregar cartinhas.</p>";
  }

  // ============================================================
  // 🟣 MONTAR CARDS NO VARAL
  // ============================================================
  function montarVaral(lista) {
    trilho.innerHTML = "";

    lista.forEach(r => {

      const nome = r.primeiro_nome || (r.nome_crianca ? r.nome_crianca.split(" ")[0] : "Criança");
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "Sonho não informado.";
      const irmaos = r.irmaos ?? "—";
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

      const btn = card.querySelector(".btn-adotar");

      // Se já estiver no carrinho
      if (estaNoCarrinho(r.id)) {
        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
      }

      // Adicionar ao carrinho
      btn.addEventListener("click", () => {
        adicionarAoCarrinho({ id: r.id, fields: r }, btn, nome);
      });

      // Modal zoom
      card.querySelector(".cartinha-quadro").addEventListener("click", (e) => {
        abrirZoom(e.currentTarget.dataset.img, nome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // ============================================================
  // 🧺 LOGICA DO CARRINHO
  // ============================================================
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

    mostrarToast(`A cartinha de ${nome} foi adicionada ao carrinho.`);
  }

  // ============================================================
  // 🔍 MODAL ZOOM
  // ============================================================
  function abrirZoom(img, nome) {
    imgZoom.src = img;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex";
  }

  closeZoom.onclick = () => (modalZoom.style.display = "none");
  window.onclick = (e) => {
    if (e.target === modalZoom) modalZoom.style.display = "none";
  };

  // ============================================================
  // ↔ SETAS DO VARAL
  // ============================================================
  const passo = 330;
  btnEsq.onclick = () => trilho.scrollBy({ left: -passo, behavior: "smooth" });
  btnDir.onclick = () => trilho.scrollBy({ left: passo, behavior: "smooth" });

});

// ============================================================
// 💬 TOAST BONITO E EMOCIONAL
// ============================================================
function mostrarToast(msg) {
  const area = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `💙 ${msg}`;

  area.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}
