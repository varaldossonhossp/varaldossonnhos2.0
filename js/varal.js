// ============================================================
// 💙 VARAL DOS SONHOS — js/varal.js
// Exibe o varal de cartinhas do Airtable.
// Campos usados (tabela “cartinhas”):
//  id_cartinha, nome_crianca, primeiro_nome, idade, sexo,
//  sonho, imagem_cartinha, status, ativo
// Mostra apenas cartinhas ativas e disponíveis.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  let cartinhas = [];

  // 1️⃣ Buscar dados da API
  try {
    const resp = await fetch("/api/cartinhas");
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinhas)) {
      trilho.innerHTML = "<p style='padding:10px'>Não foi possível carregar o varal 💙</p>";
      return;
    }

    // Filtrar: apenas ativas e status = “disponível”
    cartinhas = json.cartinhas.filter((r) => {
      const f = r.fields || {};
      const ativo = !!f.ativo;
      const status = (f.status || "").toString().toLowerCase();
      const disponivel = ativo && status.includes("dispon");
      return disponivel;
    });

    montarVaral(cartinhas);
  } catch (e) {
    console.error(e);
    trilho.innerHTML = "<p style='padding:10px'>Erro ao conectar com o servidor 💙</p>";
  }

  // 2️⃣ Montar os cards
  function montarVaral(registros) {
    trilho.innerHTML = "";

    registros.forEach((r) => {
      const f = r.fields || {};
      const nome = (f.nome_crianca || "").trim();
      const primeiroNome = f.primeiro_nome || nome.split(" ")[0] || "Criança";
      const idade = f.idade ?? "—";
      const sexo = f.sexo || "—";
      const sonho = f.sonho || "";
      const foto =
        Array.isArray(f.imagem_cartinha) && f.imagem_cartinha[0]
          ? f.imagem_cartinha[0].url
          : "/imagens/sem-foto.png";

      // item do trilho
      const gancho = document.createElement("div");
      gancho.className = "gancho";

      // card
      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <img class="foto" src="${foto}" alt="Cartinha de ${primeiroNome}">
        <div class="info">
          <h3>${primeiroNome}</h3>
          <p>🎂 ${idade} anos • ${sexo}</p>
          ${sonho ? `<p>💭 ${sonho}</p>` : ""}
        </div>
        <button class="btn-adotar">Adotar Sonho 💌</button>
      `;

      // controle do carrinho
      const btn = card.querySelector(".btn-adotar");
      const cartItem = { id_cartinha: f.id_cartinha, fields: f };

      if (estaNoCarrinho(f.id_cartinha)) {
        btn.textContent = "No Carrinho 🧺";
        btn.classList.add("btn-ocupada");
        btn.disabled = true;
      }

      btn.addEventListener("click", () => {
        adicionarAoCarrinho(cartItem, btn, primeiroNome);
      });

      gancho.appendChild(card);
      trilho.appendChild(gancho);
    });
  }

  function estaNoCarrinho(id_cartinha) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    return !!carrinho.find((i) => i.id_cartinha === id_cartinha);
  }

  function adicionarAoCarrinho(item, botao, nome) {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (!carrinho.find((i) => i.id_cartinha === item.id_cartinha)) {
      carrinho.push(item);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      botao.textContent = "No Carrinho 🧺";
      botao.classList.add("btn-ocupada");
      botao.disabled = true;
      alert(`💙 A cartinha de ${nome} foi adicionada ao carrinho!`);
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
