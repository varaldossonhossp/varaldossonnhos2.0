// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js (corrigido SEM QUEBRA)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  const modalZoom = document.getElementById("modal-cartinha-zoom");
  const imgZoom = document.getElementById("cartinha-zoom-img");
  const nomeZoom = document.getElementById("nome-cartinha-zoom");
  const closeZoom = document.querySelector(".close-zoom");

  let cartinhas = [];

  // 1) Buscar cartinhas
  try {
    const resp = await fetch("/api/cartinha");
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinhas)) {
      trilho.innerHTML = "<p style='padding:20px;'>Nenhuma cartinha disponível.</p>";
      return;
    }

    cartinhas = json.cartinhas;
    montarVaral(cartinhas);

  } catch (e) {
    console.error("Erro API cartinha:", e);
    trilho.innerHTML = "<p>Erro ao carregar cartinhas.</p>";
  }

  // 2) Montagem dos cards
  function montarVaral(lista) {
    trilho.innerHTML = "";

    lista.forEach((r) => {
      const nome = r.primeiro_nome || r.nome_crianca?.split(" ")[0] || "Criança";
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "—";
      const irmaos = r.irmaos ?? "—";
      const idadeIrmaos = r.idade_irmaos ?? "—";

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
          <img src="${foto}">
        </div>

        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p><strong>Idade:</strong> ${idade}</p>
          <p><strong>Sonho:</strong> ${sonho}</p>
          <p><strong>Irmãos:</strong> ${irmaos}</p>
          <p><strong>Idade dos irmãos:</strong> ${idadeIrmaos}</p>
        </div>

        <button class="btn-adotar" data-id="${r.id}">💙 Adotar</button>
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

      // Zoom
      card.querySelector(".cartinha-quadro")
        .addEventListener("click", (e) => {
          abrirModalZoom(foto, nome);
        });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  // Carrinho
  function estaNoCarrinho(id) {
    const c = JSON.parse(localStorage.getItem("carrinho")) || [];
    return c.some((i) => i.id === id);
  }

  function adicionarAoCarrinho(item, botao, nome) {
    const c = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (!c.find((i) => i.id === item.id)) {
      c.push(item);
      localStorage.setItem("carrinho", JSON.stringify(c));
      botao.classList.add("btn-ocupada");
      botao.textContent = "No Carrinho 🧺";
      botao.disabled = true;
      alert(`💙 A cartinha de ${nome} foi adicionada ao carrinho!`);
    }
  }

  // Modal Zoom
  function abrirModalZoom(img, nome) {
    imgZoom.src = img;
    nomeZoom.textContent = nome;
    modalZoom.style.display = "flex";
  }
  closeZoom.onclick = () => modalZoom.style.display = "none";
  window.onclick = (e) => { if (e.target === modalZoom) modalZoom.style.display = "none"; };

  // Carrossel
  const passo = 320;
  btnEsq.onclick = () => trilho.scrollBy({ left: -passo, behavior: "smooth" });
  btnDir.onclick = () => trilho.scrollBy({ left: passo, behavior: "smooth" });
});
