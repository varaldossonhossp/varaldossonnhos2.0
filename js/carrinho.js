// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão segura)
// ------------------------------------------------------------
// 1️⃣ Lista todas as cartinhas do localStorage
// 2️⃣ Exibe visualmente no carrinho
// 3️⃣ Lista pontos de coleta via /api/pontosdecoleta
// 4️⃣ Mostra mapa do ponto selecionado
// 5️⃣ Finaliza adoção e envia e-mail via EmailJS (usando .env)
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
  // 2️⃣ Carrega pontos de coleta da API
  // ============================================================
  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();

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
        if (!p.nome_ponto) return;
        const opt = document.createElement("option");
        opt.value = p.nome_ponto;
        opt.textContent = p.nome_ponto;
        opt.dataset.endereco = p.endereco || "";
        opt.dataset.telefone = p.telefone || "";
        opt.dataset.email = p.email_ponto || "";
        opt.dataset.mapa = `https://maps.google.com/maps?q=${encodeURIComponent(
          p.endereco || p.nome_ponto
        )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
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
  // 4️⃣ Finaliza adoção
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
        const dados = cartinha.fields || cartinha;

        const payload = {
          id_cartinha: dados.id_cartinha || cartinha.id_cartinha || cartinha.id,
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

        // 💾 Envia para o backend
        const resp = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (!json.sucesso) throw new Error(json.mensagem || "Erro na adoção");

        // 💌 Envia e-mail via EmailJS (usando .env local)
        const serviceID = import.meta.env?.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateID = import.meta.env?.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env?.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        emailjs.init(publicKey);
        await emailjs.send(serviceID, templateID, {
          to_name: usuario.nome_usuario || usuario.nome,
          to_email: usuario.email_usuario || usuario.email,
          nome_crianca: dados.nome_crianca,
          sonho: dados.sonho,
          ponto_coleta: opt.value,
          endereco_ponto: opt.dataset.endereco,
        });
      }

      mostrarMensagemFinal(
        "💙 Adoção registrada com sucesso! Você receberá um e-mail de confirmação."
      );
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "../index.html"), 6000);
    } catch (erro) {
      console.error("Erro ao finalizar adoção:", erro);
      alert("❌ Não foi possível concluir a adoção. Tente novamente.");
    } finally {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = "✨ Finalizar Adoção";
    }
  });

  // ============================================================
  // 5️⃣ Limpa o carrinho
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    localStorage.removeItem("carrinho");
    alert("🧺 Carrinho limpo!");
    window.location.reload();
  });
});

function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  container.innerHTML = `
    <div class="mensagem-final">
      <img src="../imagens/logo.png" alt="Varal dos Sonhos" width="200" />
      <p>${msg}</p>
      <p style="font-size:0.95rem;margin-top:15px;color:#555;">
        O administrador será notificado e o status atualizado. ✨
      </p>
      <a href="../index.html">Voltar ao Início</a>
    </div>
  `;
}
