// ============================================================
// 💙 VARAL DOS SONHOS — js/carrinho.js (versão final completa)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const listaCartinhas = document.getElementById("cartinhaSelecionada");
  const selectPonto = document.getElementById("select-ponto");
  const btnFinalizar = document.getElementById("btn-finalizar");
  const btnLimpar = document.getElementById("btn-limpar");
  const btnVerMapa = document.getElementById("btn-ver-mapa");
  const mapModal = document.getElementById("mapModal");
  const mapFrame = document.getElementById("mapFrame");
  const mapCaption = document.getElementById("mapCaption");
  const closeMap = document.getElementById("closeMap");
  const backdrop = document.getElementById("mapBackdrop");

  // ============================================================
  // 1️⃣ Recupera cartinhas do localStorage
  // ============================================================
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  if (!Array.isArray(carrinho) || carrinho.length === 0) {
    listaCartinhas.innerHTML = `
      <p>💌 Nenhuma cartinha selecionada.</p>
      <p>Adote uma no Varal Virtual.</p>
    `;
    btnFinalizar.disabled = true;
    return;
  }

  listaCartinhas.innerHTML = "";
  carrinho.forEach((item) => {
    const dados = item.fields || item;
    const imagem =
      (dados.imagem_cartinha &&
        Array.isArray(dados.imagem_cartinha) &&
        dados.imagem_cartinha[0]?.url) ||
      dados.foto ||
      "../imagens/sem-foto.png";

    const card = document.createElement("div");
    card.className = "cartinha-card";
    card.innerHTML = `
      <img src="${imagem}" alt="${dados.nome_crianca || "Criança"}" />
      <div>
        <strong>${dados.nome_crianca || "Criança"}</strong>
        <p>Sonho: ${dados.sonho || "Não informado"}</p>
      </div>
    `;
    listaCartinhas.appendChild(card);
  });

  // ============================================================
  // 2️⃣ Carrega pontos de coleta
  // ============================================================
  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();

    if (json?.records?.length) {
      json.records.forEach((r) => {
        const p = r.fields;
        if (!p.nome_ponto) return;
        const opt = document.createElement("option");
        opt.value = p.nome_ponto;
        opt.textContent = p.nome_ponto;
        opt.dataset.id = r.id; // ✅ ID real do Airtable
        opt.dataset.endereco = p.endereco || "";
        selectPonto.appendChild(opt);
      });
    } else {
      selectPonto.innerHTML = "<option>Nenhum ponto disponível</option>";
    }
  } catch (erro) {
    console.error("❌ Erro ao carregar pontos de coleta:", erro);
    selectPonto.innerHTML = "<option>Erro ao carregar pontos</option>";
  }

  // ============================================================
  // 3️⃣ Finaliza adoção
  // ============================================================
  btnFinalizar.addEventListener("click", async () => {
    const opt = selectPonto.options[selectPonto.selectedIndex];
    if (!opt || opt.value === "Selecione um ponto...") {
      alert("⚠️ Selecione um ponto de coleta antes de finalizar.");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    if (!usuario.id) {
      alert("⚠️ Faça login antes de adotar uma cartinha.");
      return;
    }

    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Enviando...";

    try {
      for (const cartinha of carrinho) {
        const idCartinha = cartinha.id || cartinha.fields?.id_cartinha;
        const payload = {
          id_cartinha: idCartinha,
          id_usuario: usuario.id,
          ponto_coleta: { id: opt.dataset.id, nome: opt.value },
        };

        const resp = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (!json.sucesso) throw new Error(json.mensagem);
      }

      mostrarMensagemFinal(
        "💙 Todas as adoções foram registradas com sucesso!<br>O administrador foi notificado por e-mail."
      );
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "../index.html"), 5000);
    } catch (erro) {
      console.error("❌ Erro ao finalizar adoção:", erro);
      alert("❌ Não foi possível concluir a adoção. Verifique os dados e tente novamente.");
    } finally {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = "✨ Finalizar Adoção";
    }
  });

  // ============================================================
  // 4️⃣ Limpar carrinho
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    localStorage.removeItem("carrinho");
    alert("🧺 Carrinho limpo!");
    window.location.reload();
  });
});

// ============================================================
// Mensagem final
// ============================================================
function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  container.innerHTML = `
    <div class="mensagem-final">
      <img src="../imagens/logo.png" alt="Varal dos Sonhos" width="200" />
      <p>${msg}</p>
      <a href="../index.html">Voltar ao Início</a>
    </div>
  `;
}
