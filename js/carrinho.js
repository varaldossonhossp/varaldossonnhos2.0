// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão final 2025-11-02)
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
    listaCartinhas.innerHTML = `<p>💌 Nenhuma cartinha selecionada.</p><p>Adote uma no Varal Virtual.</p>`;
    btnFinalizar.disabled = true;
    return;
  }

  listaCartinhas.innerHTML = "";
  carrinho.forEach((item) => {
    const dados = item.fields || item;
    const imagem =
      (dados.imagem_cartinha && dados.imagem_cartinha[0]?.url) ||
      dados.foto?.[0]?.url ||
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
  // 2️⃣ Carrega pontos de coleta com IDs reais
  // ============================================================
  try {
    const resp = await fetch("/api/pontosdecoleta", { cache: "no-store" });
    const json = await resp.json();

    let lista = [];
    if (json?.records && Array.isArray(json.records)) {
      lista = json.records.map((r) => ({
        id: r.id,
        nome_ponto: r.fields?.nome_ponto,
        endereco: r.fields?.endereco,
        telefone: r.fields?.telefone,
        email_ponto: r.fields?.email_ponto,
      }));
    }

    console.log("🗺️ Pontos carregados:", lista);

    lista.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nome_ponto;
      opt.dataset.endereco = p.endereco;
      opt.dataset.telefone = p.telefone;
      opt.dataset.email = p.email_ponto;
      selectPonto.appendChild(opt);
    });
  } catch (erro) {
    console.error("❌ Erro ao carregar pontos de coleta:", erro);
  }

  // ============================================================
  // 3️⃣ Ver localização (abre modal com mapa)
  // ============================================================
  btnVerMapa.addEventListener("click", () => {
    const opt = selectPonto.options[selectPonto.selectedIndex];
    if (!opt || !opt.dataset.endereco) {
      alert("Selecione um ponto de coleta para visualizar o mapa.");
      return;
    }

    const endereco = encodeURIComponent(opt.dataset.endereco);
    mapFrame.src = `https://www.google.com/maps?q=${endereco}&output=embed`;
    mapCaption.textContent = `📍 ${opt.textContent}`;
    mapModal.style.display = "block";
    backdrop.style.display = "block";
  });

  closeMap.addEventListener("click", () => {
    mapModal.style.display = "none";
    backdrop.style.display = "none";
  });

  backdrop.addEventListener("click", () => {
    mapModal.style.display = "none";
    backdrop.style.display = "none";
  });

  // ============================================================
  // 4️⃣ Finaliza adoção
  // ============================================================
  btnFinalizar.addEventListener("click", async () => {
    const pontoId = selectPonto.value;
    if (!pontoId) {
      alert("⚠️ Escolha um ponto de coleta antes de finalizar.");
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
        const idCartinha = cartinha.id || cartinha.fields?.id;
        const payload = {
          nome_crianca_id: idCartinha,
          nome_usuario_id: usuario.id,
          pontos_coleta_id: pontoId,
        };

        const resp = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (!json.success) throw new Error(json.message);
      }

      mostrarMensagemFinal(
        "💙 Todas as adoções foram registradas com sucesso!<br>O administrador foi notificado por e-mail."
      );
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "../index.html"), 5000);
    } catch (erro) {
      console.error("❌ Erro ao finalizar adoção:", erro);
      alert("Erro ao concluir a adoção. Verifique os dados e tente novamente.");
    } finally {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = "✨ Finalizar Adoção";
    }
  });

  // ============================================================
  // 5️⃣ Limpar carrinho
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    localStorage.removeItem("carrinho");
    alert("🧺 Carrinho limpo!");
    window.location.reload();
  });
});

// ============================================================
// Função de mensagem final
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
