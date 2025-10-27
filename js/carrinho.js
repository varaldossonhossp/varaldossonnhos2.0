// ============================================================
// 💙 VARAL DOS SONHOS — js/carrinho.js
// Lê carrinho do localStorage, exibe cartinhas e envia adoções.
// Campos API esperados (tabela “adocoes”):
//  id_cartinha, nome_doador, email_doador, ponto_coleta
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById("lista-carrinho");
  const pontoSelect = document.getElementById("ponto");
  const btnConfirmar = document.getElementById("confirmarAdocao");

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  // 1️⃣ Exibir carrinho
  function exibirCarrinho() {
    lista.innerHTML = "";
    if (carrinho.length === 0) {
      lista.innerHTML = "<p>Seu carrinho está vazio 💙</p>";
      btnConfirmar.disabled = true;
      return;
    }
    btnConfirmar.disabled = false;

    carrinho.forEach((item) => {
      const f = item.fields || {};
      const foto =
        Array.isArray(f.imagem_cartinha) && f.imagem_cartinha[0]
          ? f.imagem_cartinha[0].url
          : "/imagens/sem-foto.png";

      const card = document.createElement("div");
      card.className = "card-carrinho";
      card.innerHTML = `
        <img src="${foto}" alt="${f.nome_crianca}">
        <h3>${f.nome_crianca}</h3>
        <p>🎂 ${f.idade || "—"} anos</p>
        ${f.sonho ? `<p>💭 ${f.sonho}</p>` : ""}
      `;
      lista.appendChild(card);
    });
  }

  // 2️⃣ Carregar pontos de coleta
  async function carregarPontos() {
    try {
      const resp = await fetch("/api/pontosdecoleta");
      const json = await resp.json();
      if (json.sucesso && json.pontos) {
        json.pontos.forEach((p) => {
          const nome = p.fields?.nome || "Ponto";
          const opt = document.createElement("option");
          opt.value = nome;
          opt.textContent = nome;
          pontoSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("Erro ao carregar pontos:", e);
    }
  }

  // 3️⃣ Confirmar adoção
  btnConfirmar.addEventListener("click", async () => {
    const ponto = pontoSelect.value;
    if (!ponto) {
      alert("Selecione um ponto de coleta 💙");
      return;
    }
    if (carrinho.length === 0) return;

    try {
      for (const item of carrinho) {
        const f = item.fields || {};
        const payload = {
          id_cartinha: f.id_cartinha,
          nome_doador: "Visitante",
          email_doador: "visitante@exemplo.com",
          ponto_coleta: ponto,
        };

        const resp = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (!json.sucesso) {
          console.error("Falha ao adotar:", json.mensagem);
          alert(`Erro ao adotar a cartinha de ${f.nome_crianca}.`);
        }
      }

      alert("💙 Adoção registrada com sucesso!");
      localStorage.removeItem("carrinho");
      location.reload();
    } catch (erro) {
      console.error("Erro ao registrar adoção:", erro);
      alert("Erro ao registrar adoção. Tente novamente.");
    }
  });

  exibirCarrinho();
  carregarPontos();
});
