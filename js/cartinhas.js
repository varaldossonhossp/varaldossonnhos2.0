// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js
// ------------------------------------------------------------
// Lista as cartinhas, monta o carrossel, adiciona ao carrinho e cuida do zoom.
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
    // Adicionar tratamento de erro 404/500
    if (!resp.ok) {
        throw new Error(`Falha no servidor. Status: ${resp.status}`);
    }
    
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinhas)) {
      trilho.innerHTML = "<p style='padding:20px; color:#c0392b;'>⚠️ Varal vazio ou não foi possível carregar as cartinhas 💙</p>";
       return;
     }

    // Airtable já filtra a maioria, mas reforçamos.
    cartinhas = json.cartinhas; 

    montarVaral(cartinhas);
  } catch (e) {
    console.error("Erro ao carregar cartinhas:", e);
    trilho.innerHTML = "<p style='padding:20px; color:#c0392b;'>❌ Erro ao conectar com o servidor da API. Tente mais tarde.</p>";
  }

  // 2️⃣ Montar os cards
  function montarVaral(registros) {
    trilho.innerHTML = "";

    registros.forEach((r) => {
      const nome = (r.primeiro_nome || "").trim() || "Criança";
      const idade = r.idade ?? "—";
      const sonho = r.sonho || "Sonho não especificado.";
      
      // Campos de texto (Single Line Text)
      const irmaos = r.irmaos?.toUpperCase() || "NÃO"; // Trata como texto e coloca em maiúsculo
      const idadeIrmaos = r.idade_irmaos ?? "—"; 
      
      const foto =
        Array.isArray(r.imagem_cartinha) && r.imagem_cartinha[0]
          ? r.imagem_cartinha[0].url
          : "/imagens/sem-foto.png"; // Use uma imagem placeholder se não houver

      // item do trilho (Gancho)
      const gancho = document.createElement("div");
      gancho.className = "gancho";

      // card
      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <div class="cartinha-img-wrapper" data-img="${foto}" data-nome="${nome}">
          <img src="${foto}" alt="Cartinha de ${nome}" />
        </div>
        <div class="info-cartinha">
          <h3>${nome}</h3>
          <p class="detalhes">🎂 ${idade} anos | 💭 ${sonho}</p>
          <p>Irmãos: <strong>${irmaos}</strong></p>
          ${irmaos === 'SIM' ? `<p>Idade dos Irmãos: ${idadeIrmaos}</p>` : ''}         </div>
        <button class="btn-adotar" data-id="${r.id}">Adotar Sonho 💌</button>
      `;

      // --- Lógica de Adoção ---
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
      
      // --- Lógica de Zoom (Clicar na Imagem) ---
      card.querySelector(".cartinha-img-wrapper").addEventListener('click', (e) => {
        const imgUrl = e.currentTarget.dataset.img;
        const criancaNome = e.currentTarget.dataset.nome;
        abrirModalZoom(imgUrl, criancaNome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }
  
  // --- Funções Auxiliares de Carrinho ---

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
  
  // --- Funções Auxiliares de Zoom ---
  function abrirModalZoom(imgUrl, nome) {
    imgZoom.src = imgUrl;
    nomeZoom.textContent = `Cartinha de ${nome}`;
    modalZoom.style.display = "flex"; // Usa flex para centralizar
  }
  
  closeZoom.onclick = function() {
    modalZoom.style.display = "none";
  }
  
  window.onclick = function(event) {
    if (event.target == modalZoom) {
      modalZoom.style.display = "none";
    }
  }

  // 3️⃣ Controles do carrossel
  const passo = 300;

  btnEsq.addEventListener("click", () => {
    trilho.scrollBy({ left: -passo, behavior: "smooth" });
  });

  btnDir.addEventListener("click", () => {
    trilho.scrollBy({ left: passo, behavior: "smooth" });
  });
});