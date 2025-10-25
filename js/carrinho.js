// ============================================================
// 💙 VARAL DOS SONHOS — js/carrinho.js
// Lê carrinho do localStorage, mostra as cartinhas,
// permite escolher ponto de coleta e confirmar adoção.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById("lista-carrinho");
  const pontoSelect = document.getElementById("ponto");
  const btnConfirmar = document.getElementById("confirmarAdocao");

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  // ========== Mostra cartinhas ==========
  function exibirCarrinho() {
    lista.innerHTML = "";
    if (carrinho.length === 0) {
      lista.innerHTML = "<p>Seu carrinho está vazio 💙</p>";
      btnConfirmar.disabled = true;
      return;
    }
    btnConfirmar.disabled = false;

    carrinho.forEach(item => {
      const f = item.fields;
      const foto = f.foto?.[0]?.url || "/imagens/sem-foto.png";
      const card = document.createElement("div");
      card.className = "card-carrinho";
      card.innerHTML = `
        <img src="${foto}" alt="${f.nome_crianca}">
        <h3>${f.nome_crianca}</h3>
        <p>🎂 ${f.idade} anos</p>
        <p>💭 ${f.sonho || ""}</p>
      `;
      lista.appendChild(card);
    });
  }

  // ========== Carrega pontos de coleta ==========
  async function carregarPontos() {
    try {
      const resp = await fetch("/api/pontosdecoleta");
      const json = await resp.json();
      if (json.sucesso && json.pontos) {
        json.pontos.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.fields.nome;
          opt.textContent = p.fields.nome;
          pontoSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("Erro ao carregar pontos:", e);
    }
  }

  // ========== Confirmar adoção ==========
  btnConfirmar.addEventListener("click", async () => {
    const ponto = pontoSelect.value;
    if (!ponto) {
      alert("Selecione um ponto de coleta 💙");
      return;
    }
    if (carrinho.length === 0) return;

    try {
      for (const item of carrinho) {
        await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: "Visitante",           // futuramente login
            cartinha_id: item.id,
            ponto_coleta: ponto
          })
        });
      }

      alert("💙 Adoção confirmada! Você receberá um e-mail com as orientações.");
      localStorage.removeItem("carrinho");
      location.reload();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao registrar adoção. Tente novamente.");
    }
  });

  exibirCarrinho();
  carregarPontos();
});
