// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão TCC final)
// ------------------------------------------------------------
// Função: lê o carrinho salvo no localStorage e exibe as
// cartinhas selecionadas pelo doador.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-carrinho");
  const btnFinalizar = document.getElementById("btn-finalizar");

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  // ============================================================
  // 1️⃣ Exibir as cartinhas no carrinho
  // ============================================================
  if (carrinho.length === 0) {
    lista.innerHTML = "<p>💭 Seu carrinho está vazio. Adote um sonho!</p>";
    if (btnFinalizar) btnFinalizar.disabled = true;
    return;
  }

  lista.innerHTML = "";
  carrinho.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item-carrinho";
    div.innerHTML = `
      <img src="${item.foto}" alt="${item.nome_crianca}" class="foto-carrinho" />
      <div>
        <h3>${item.nome_crianca}</h3>
        <p>💭 ${item.sonho}</p>
      </div>
      <button class="btn-remover" data-index="${index}">❌</button>
    `;
    lista.appendChild(div);
  });

  // ============================================================
  // 2️⃣ Remover cartinha do carrinho
  // ============================================================
  document.querySelectorAll(".btn-remover").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      carrinho.splice(index, 1);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      location.reload();
    });
  });

  // ============================================================
  // 3️⃣ Finalizar adoção (ainda não envia à API)
  // ============================================================
  btnFinalizar?.addEventListener("click", () => {
    alert("💙 Obrigado por adotar um sonho! Em breve entraremos em contato.");
    localStorage.removeItem("carrinho");
    window.location.href = "../index.html";
  });
});
