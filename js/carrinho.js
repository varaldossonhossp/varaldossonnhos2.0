// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão final)
// ------------------------------------------------------------
// 1️⃣ Carrega a cartinha salva no localStorage
// 2️⃣ Exibe dados na tela
// 3️⃣ Lista pontos de coleta via /api/pontosdecoleta
// 4️⃣ Mostra mapa do ponto selecionado
// 5️⃣ Finaliza adoção (POST /api/adocoes)
// 6️⃣ Limpa carrinho
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const imgCartinha = document.getElementById("cartinha-img");
  const nomeSpan = document.getElementById("nome-crianca");
  const sonhoSpan = document.getElementById("sonho-crianca");
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
  // 1️⃣ Recupera cartinha do localStorage
  // ============================================================
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  if (carrinho.length === 0) {
    nomeSpan.textContent = "(nenhuma cartinha selecionada)";
    sonhoSpan.textContent = "Selecione uma cartinha no Varal Virtual.";
    btnFinalizar.disabled = true;
    return;
  }

  const ultima = carrinho[carrinho.length - 1];
  const dados = ultima.fields || ultima;

  // 🔹 Corrige imagem da cartinha
  const imagem =
    (dados.imagem_cartinha &&
      Array.isArray(dados.imagem_cartinha) &&
      dados.imagem_cartinha[0]?.url) ||
    dados.foto ||
    "../imagens/sem-foto.png";

  imgCartinha.src = imagem;
  nomeSpan.textContent = dados.nome_crianca || "Criança sem nome";
  sonhoSpan.textContent = "Sonho: " + (dados.sonho || "Não informado");

  // ============================================================
  // 2️⃣ Carrega pontos de coleta da API
  // ============================================================
  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();

    // Aceita tanto "pontos" quanto "records"
    const lista =
      json.pontos ||
      (json.records
        ? json.records.map((r) => ({
            nome_ponto: r.fields?.nome_ponto,
            endereco: r.fields?.endereco,
            telefone: r.fields?.telefone,
            email_ponto: r.fields?.email_ponto,
          }))
        : []);

    if (Array.isArray(lista) && lista.length > 0) {
      lista.forEach((p) => {
        if (!p.nome_ponto) return; // ignora registros incompletos
        const opt = document.createElement("option");
        opt.value = p.nome_ponto;
        opt.textContent = p.nome_ponto;
        opt.dataset.endereco = p.endereco || "";
        opt.dataset.telefone = p.telefone || "";
        opt.dataset.email = p.email_ponto || "";
        opt.dataset.mapa = `https://www.google.com/maps?q=${encodeURIComponent(
          p.endereco || p.nome_ponto
        )}`;
        selectPonto.appendChild(opt);
      });
    } else {
      console.warn("⚠️ Nenhum ponto de coleta encontrado.");
    }
  } catch (erro) {
    console.error("❌ Erro ao carregar pontos de coleta:", erro);
  }

  // ============================================================
  // 3️⃣ Abre modal do mapa
  // ============================================================
  btnVerMapa.addEventListener("click", () => {
    const opt = selectPonto.options[selectPonto.selectedIndex];
    if (!opt || opt.value === "Selecione um ponto...") {
      alert("⚠️ Escolha um ponto de coleta primeiro!");
      return;
    }
    mapFrame.src = opt.dataset.mapa;
    mapCaption.textContent = opt.dataset.endereco || opt.value;
    mapModal.style.display = "flex";
  });

  closeMap.addEventListener("click", () => (mapModal.style.display = "none"));
  backdrop.addEventListener("click", () => (mapModal.style.display = "none"));

  // ============================================================
  // 4️⃣ Finaliza a adoção
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

    const payload = {
      id_cartinha: ultima.id,
      id_usuario: usuario.id,
      nome_doador: usuario.nome_usuario || usuario.nome,
      email_doador: usuario.email_usuario || usuario.email,
      telefone_doador: usuario.telefone || "",
      ponto_coleta: {
        nome: opt.value,
        endereco: opt.dataset.endereco,
        telefone: opt.dataset.telefone,
        email: opt.dataset.email,
      },
      nome_crianca: dados.nome_crianca,
      sonho: dados.sonho,
    };

    try {
      const resp = await fetch("/api/adocoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();

      if (!json.sucesso) throw new Error(json.mensagem || "Falha na adoção");

      mostrarMensagemFinal(
        "💙 Adoção registrada com sucesso!<br>O administrador foi notificado por e-mail."
      );
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "../index.html"), 5000);
    } catch (erro) {
      console.error("Erro ao finalizar adoção:", erro);
      alert("❌ Não foi possível concluir a adoção. Tente novamente.");
    }
  });

  // ============================================================
  // 5️⃣ Botão limpar carrinho
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    localStorage.removeItem("carrinho");
    alert("🧺 Carrinho limpo!");
    window.location.reload();
  });
});

// ============================================================
// Mensagem de sucesso
// ============================================================
function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  container.innerHTML = `
    <div class="mensagem-final">
      <img src="../imagens/logo.png" alt="Varal dos Sonhos" width="200" />
      <p>${msg}</p>
      <p style="font-size:0.95rem;margin-top:15px;color:#555;">
        Você receberá um e-mail assim que a adoção for confirmada. ✨
      </p>
      <a href="../index.html">Voltar ao Início</a>
    </div>
  `;
}
