// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão final 2025-11-02)
// ------------------------------------------------------------
// Fluxo completo do carrinho de adoção:
// 1. Mostra cartinhas selecionadas
// 2. Carrega pontos de coleta ativos
// 3. Mostra mapa do ponto
// 4. Finaliza adoção com integração Airtable + EmailJS
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

  if (!listaCartinhas || !selectPonto || !btnFinalizar) {
    console.error("DOM incompleto: verifique IDs HTML.");
    return;
  }

  // ============================================================
  // 1️⃣ Recupera cartinhas
  // ============================================================
  let carrinho = [];
  try {
    carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  } catch {
    carrinho = [];
  }

  if (!Array.isArray(carrinho) || carrinho.length === 0) {
    listaCartinhas.innerHTML = `<p>💌 Nenhuma cartinha selecionada.</p>`;
    btnFinalizar.disabled = true;
    return;
  }

  listaCartinhas.innerHTML = "";
  carrinho.forEach((item) => {
    const fields = item.fields || item;
    const nome = fields.nome_crianca || "Criança";
    const sonho = fields.sonho || "Não informado";
    const img =
      (fields.imagem_cartinha?.[0]?.url || "../imagens/sem-foto.png");

    listaCartinhas.innerHTML += `
      <div class="cartinha-card">
        <img src="${img}" alt="${nome}" onerror="this.src='../imagens/sem-foto.png'"/>
        <div><strong>${nome}</strong><p>Sonho: ${sonho}</p></div>
      </div>`;
  });

  // ============================================================
  // 2️⃣ Carrega pontos de coleta
  // ============================================================
  try {
    const resp = await fetch("/api/pontosdecoleta", { cache: "no-store" });
    const json = await resp.json();
    console.log("🗺️ Pontos carregados:", json);

    const lista = (json?.pontos || json?.records || []).map((p) => ({
      id: p.id || p.recordId || p.id_ponto, // recordId real
      nome: p.nome_ponto || p.fields?.nome_ponto || "Ponto",
      endereco: p.endereco || p.fields?.endereco || "",
      telefone: p.telefone || p.fields?.telefone || "",
      email: p.email_ponto || p.fields?.email_ponto || "",
    }));

    selectPonto.innerHTML = '<option value="">Selecione um ponto...</option>';
    lista.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id; // recordId correto
      opt.textContent = p.nome;
      opt.dataset.endereco = p.endereco;
      opt.dataset.telefone = p.telefone;
      opt.dataset.email = p.email;
      selectPonto.appendChild(opt);
    });
  } catch (erro) {
    console.error("Erro ao carregar pontos:", erro);
    selectPonto.innerHTML = '<option value="">Erro ao carregar pontos</option>';
  }

  // ============================================================
  // 3️⃣ Ver no mapa
  // ============================================================
  btnVerMapa?.addEventListener("click", () => {
    const opt = selectPonto.options[selectPonto.selectedIndex];
    if (!opt || !opt.dataset.endereco) return alert("Selecione um ponto primeiro!");
    const endereco = encodeURIComponent(opt.dataset.endereco);
    mapFrame.src = `https://www.google.com/maps?q=${endereco}&output=embed`;
    mapCaption.textContent = `📍 ${opt.textContent}`;
    mapModal.style.display = "flex";
    backdrop.style.display = "block";
  });

  closeMap?.addEventListener("click", () => fecharMapa(mapModal, backdrop, mapFrame));
  backdrop?.addEventListener("click", () => fecharMapa(mapModal, backdrop, mapFrame));

  // ============================================================
  // 4️⃣ Finalizar adoção — CORRIGIDO
  // ============================================================
  btnFinalizar.addEventListener("click", async () => {
    const pontoId = selectPonto.value;
    if (!pontoId) return alert("Escolha um ponto antes de finalizar.");

    const usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    if (!usuario || !usuario.id) {
      return alert("Faça login antes de adotar.");
    }

    const usuarioRecordId = usuario.id; // recordId REAL do usuário

    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Enviando...";

    try {
      for (const c of carrinho) {
        const idCartinha = c.id || c.recordId || c.fields?.recordId;
        if (!idCartinha) {
          console.error("❌ Cartinha sem recordId:", c);
          continue;
        }

        // 🔥 CAMPOS REAIS DO AIRTABLE
        const payload = {
          usuario: [usuarioRecordId],
          cartinha: [idCartinha],
          pontos_coleta: [pontoId],
          status_adocao: "aguardando confirmacao",
        };

        const r = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const j = await r.json();
        if (!j?.sucesso) throw new Error(j?.mensagem || "Erro ao adotar.");
      }

      mostrarMensagemFinal("💙 Adoção concluída! O administrador foi notificado.");
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "../index.html"), 5000);
    } catch (erro) {
      console.error("❌ Erro ao finalizar adoção:", erro);
      alert("Erro ao concluir adoção. Verifique o console.");
    } finally {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = "✨ Finalizar Adoção";
    }
  });

  // ============================================================
  // 5️⃣ Limpar carrinho
  // ============================================================
  btnLimpar?.addEventListener("click", () => {
    localStorage.removeItem("carrinho");
    alert("🧺 Carrinho limpo!");
    window.location.reload();
  });
});

// ============================================================
// Funções auxiliares
// ============================================================
function fecharMapa(modal, backdrop, iframe) {
  modal.style.display = "none";
  backdrop.style.display = "none";
  iframe.src = "";
}

function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  container.innerHTML = `
    <div class="mensagem-final">
      <img src="../imagens/logo.png" alt="Varal dos Sonhos" width="200" />
      <p>${msg}</p>
      <a href="../index.html">Voltar ao início</a>
    </div>`;
}
