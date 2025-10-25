// ============================================================
// 💙 VARAL DOS SONHOS — js/varal.js
// Varal com carrossel horizontal de cartinhas penduradas.
// Campos Airtable (tabela "cartinhas"):
//  - nome_crianca (texto), idade (número), sexo (texto),
//  - irmaos (checkbox/bool), sonho (texto), foto (anexo[]),
//  - status (texto), adotada (checkbox/bool), ativo (checkbox/bool)
// Mostramos apenas cartinhas ativas e disponíveis.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const trilho = document.getElementById("trilho-varal");
  const btnEsq = document.querySelector(".seta-esq");
  const btnDir = document.querySelector(".seta-dir");

  let cartinhas = [];

  // 1) Busca dados da API
  try {
    const resp = await fetch("/api/cartinhas"); // a sua API já existente
    const json = await resp.json();

    if (!json?.sucesso || !Array.isArray(json.cartinhas)) {
      trilho.innerHTML = "<p style='padding:10px'>Não foi possível carregar o varal.</p>";
      return;
    }

    // Filtra: ativas e disponíveis (status “disponivel” e adotada = false)
    cartinhas = json.cartinhas.filter(r => {
      const f = r.fields || {};
      const ativo = !!f.ativo;
      const adotada = !!f.adotada;
      const status = (f.status || "").toString().toLowerCase(); // disponivel | aguardando | adotada …
      // consideramos disponível se não marcada como adotada e status contém 'dispon'
      const disponivel = !adotada && status.includes("dispon");
      return ativo && disponivel;
    });

    // Monta o varal
    montarVaral(cartinhas);
  } catch (e) {
    console.error(e);
    trilho.innerHTML = "<p style='padding:10px'>Erro ao conectar com o servidor.</p>";
  }

  // 2) Montagem dos cards
  function montarVaral(registros) {
    trilho.innerHTML = "";

    registros.forEach((r) => {
      const f = r.fields || {};
      const nome = (f.nome_crianca || "").toString().trim();
      const primeiroNome = nome.split(" ")[0] || "Criança";
      const idade = f.idade ?? "—";
      const sexo = f.sexo || "—";
      const temIrmaos = !!f.irmaos;
      const sonho = f.sonho || "";
      const foto = Array.isArray(f.foto) && f.foto[0] ? f.foto[0].url : "/imagens/sem-foto.png";

      // item do trilho
      const gancho = document.createElement("div");
      gancho.className = "gancho";

      // card
      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <img class="foto" src="${foto}" alt="Cartinha de ${primeiroNome}">
        <div class="info">
          <h3>${primeiroNome}
            ${temIrmaos ? '<span class="badge">👨‍👧 Irmãos</span>' : ""}
          </h3>
          <p>🎂 Idade: ${idade} • ${sexo}</p>
          ${sonho ? `<p>💭 Sonho: ${sonho}</p>` : ""}
        </div>
        <button class="btn-adotar">Adotar Sonho 💌</button>
      `;

      // Lógica do carrinho (localStorage)
      const btn = card.querySelector(".btn-adotar");
      const cartItem = { id: r.id, fields: f };

      if (estaNoCarrinho(r.id)) {
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

  // 3) Controles do carrossel (scroll horizontal)
  const passo = 300; // pixels por clique

  btnEsq.addEventListener("click", () => {
    trilho.scrollBy({ left: -passo, behavior: "smooth" });
  });
  btnDir.addEventListener("click", () => {
    trilho.scrollBy({ left: passo, behavior: "smooth" });
  });
});
