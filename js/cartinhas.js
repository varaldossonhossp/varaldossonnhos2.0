// ============================================================
// 💙 VARAL DOS SONHOS — /js/cartinhas.js
// ------------------------------------------------------------
// Lista as cartinhas da tabela "cartinhas" do Airtable.
// Permite buscar, filtrar e adicionar cartinhas ao carrinho.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const listaContainer = document.getElementById("lista-cartinhas");
  const inputBusca = document.getElementById("buscaCartinha");

  let todasCartinhas = [];

  // ============================================================
  // 1️⃣ Carrega as cartinhas da API
  // ============================================================
  async function carregarCartinhas() {
    try {
      const resposta = await fetch("/api/cartinhas");
      const data = await resposta.json();

      if (!data.sucesso || !data.cartinhas) {
        listaContainer.innerHTML = "<p>❌ Não foi possível carregar as cartinhas.</p>";
        return;
      }

      todasCartinhas = data.cartinhas;
      exibirCartinhas(todasCartinhas);
    } catch (erro) {
      console.error("Erro ao buscar cartinhas:", erro);
      listaContainer.innerHTML = "<p>⚠️ Erro ao carregar dados.</p>";
    }
  }

  // ============================================================
  // 2️⃣ Renderiza os cards das cartinhas
  // ============================================================
  function exibirCartinhas(cartinhas) {
    listaContainer.innerHTML = "";

    cartinhas.forEach((c) => {
      const f = c.fields;
      const imgUrl = f.foto?.[0]?.url || "/imagens/sem-foto.png";
      const estaAdotada = f.status && f.status.toLowerCase() !== "disponível";

      const card = document.createElement("div");
      card.classList.add("card-cartinha");

      card.innerHTML = `
        <img src="${imgUrl}" alt="Cartinha de ${f.nome_crianca}">
        <div class="info-cartinha">
          <h3>${f.nome_crianca}</h3>
          <p>🎂 Idade: ${f.idade || "?"} anos</p>
          <p>💭 Sonho: ${f.sonho || "—"}</p>
          <p>👦 Sexo: ${f.sexo || "—"}</p>
          <p>👨‍👧 Irmãos: ${f.irmaos ? "Sim" : "Não"}</p>
        </div>
        <button class="btn-adotar ${estaAdotada ? "btn-noCarrinho" : ""}">
          ${estaAdotada ? "Adotada 💙" : "Adotar Sonho 💌"}
        </button>
      `;

      const botao = card.querySelector("button");
      if (!estaAdotada) {
        botao.addEventListener("click", () => adicionarAoCarrinho(c));
      }

      listaContainer.appendChild(card);
    });
  }

  // ============================================================
  // 3️⃣ Adiciona a cartinha ao carrinho (localStorage)
  // ============================================================
  function adicionarAoCarrinho(cartinha) {
    const f = cartinha.fields;
    const id_cartinha = f.id_cartinha || cartinha.id;

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const jaExiste = carrinho.find((item) => item.id_cartinha === id_cartinha);

    if (!jaExiste) {
      carrinho.push({
        id_cartinha,
        nome_crianca: f.nome_crianca,
        idade: f.idade,
        sonho: f.sonho,
        sexo: f.sexo,
        irmaos: f.irmaos,
        foto: f.foto,
      });

      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      alert(`💌 Cartinha de ${f.nome_crianca} adicionada ao carrinho!`);
      carregarCartinhas();
    } else {
      alert("Essa cartinha já está no seu carrinho 💙");
    }
  }

  // ============================================================
  // 4️⃣ Filtro de busca
  // ============================================================
  inputBusca?.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    const filtradas = todasCartinhas.filter((c) => {
      const nome = (c.fields.nome_crianca || "").toLowerCase();
      const sonho = (c.fields.sonho || "").toLowerCase();
      return nome.includes(termo) || sonho.includes(termo);
    });
    exibirCartinhas(filtradas);
  });

  // Inicializa
  carregarCartinhas();
});
