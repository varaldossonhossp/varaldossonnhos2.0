// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão revisada mínima)
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
  // 2️⃣ Carrega pontos de coleta (compatível com records/pontos/array)
  // ============================================================
  try {
    // limpa opções antigas (mantém a primeira "Selecione um ponto...")
    while (selectPonto.options.length > 1) selectPonto.remove(1);

    const resp = await fetch("/api/pontosdecoleta", { cache: "no-store" });
    const json = await resp.json();

    let lista = [];

    // Formato Airtable: { records: [{fields:{...}}] }
    if (json?.records) {
      lista = json.records.map((r) => ({
        nome_ponto: r.fields?.nome_ponto || "Ponto sem nome",
        endereco: r.fields?.endereco || "",
        telefone: r.fields?.telefone || "",
        email_ponto: r.fields?.email_ponto || "",
      }));
    }
    // Formato simples: { pontos: [...] }
    else if (Array.isArray(json?.pontos)) {
      lista = json.pontos;
    }
    // Formato array direto: [...]
    else if (Array.isArray(json)) {
      lista = json;
    }
    // Formato alternativo: { data: [...] }
    else if (Array.isArray(json?.data)) {
      lista = json.data;
    }

    if (Array.isArray(lista) && lista.length > 0) {
      lista.forEach((p) => {
        if (!p?.nome_ponto) return;
        const opt = document.createElement("option");
        opt.value = p.nome_ponto;
        opt.textContent = p.nome_ponto;
        opt.dataset.endereco = p.endereco || "";
        opt.dataset.telefone = p.telefone || "";
        opt.dataset.email = p.email_ponto || "";
        selectPonto.appendChild(opt);
      });
    } else {
      console.warn("⚠️ Nenhum ponto de coleta encontrado na API:", json);
    }
  } catch (erro) {
    console.error("❌ Erro ao carregar pontos de coleta:", erro);
  }

  // ============================================================
  // (Opcional) Ver Mapa do ponto
  // ============================================================
  btnVerMapa?.addEventListener("click", () => {
    const opt = selectPonto.options[selectPonto.selectedIndex];
    if (!opt || opt.value === "Selecione um ponto...") {
      alert("⚠️ Escolha um ponto de coleta primeiro!");
      return;
    }
    const endereco = opt.dataset.endereco || opt.value;
    const urlMapa = `https://maps.google.com/maps?q=${encodeURIComponent(
      endereco
    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    if (mapFrame && mapCaption && mapModal) {
      mapFrame.src = urlMapa;
      mapCaption.textContent = endereco;
      mapModal.style.display = "flex";
    }
  });

  closeMap?.addEventListener("click", () => (mapModal.style.display = "none"));
  backdrop?.addEventListener("click", () => (mapModal.style.display = "none"));

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
        const dados = cartinha.fields || cartinha;

        // 🔧 Garantindo recordId do Airtable
        const idCartinha =
          cartinha.id || dados.id_cartinha || dados.recordId || dados.id;

        if (!idCartinha) {
          throw new Error("Cartinha sem recordId válido.");
        }

        const payload = {
          id_cartinha: idCartinha,
          id_usuario: usuario.id,
          nome_doador: usuario.nome_usuario || usuario.nome,
          email_doador: usuario.email_usuario || usuario.email,
          telefone_doador: usuario.telefone || "",
          ponto_coleta: {
            nome: opt.value,
            endereco: opt.dataset.endereco || "",
            telefone: opt.dataset.telefone || "",
            email: opt.dataset.email || "",
          },
          nome_crianca: dados.nome_crianca,
          sonho: dados.sonho,
        };

        const r = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Se a função serverless quebrar, o body pode não ser JSON.
        let j;
        try {
          j = await r.json();
        } catch {
          const texto = await r.text();
          throw new Error(
            "A server retornou erro 500. Detalhes: " + (texto || "sem detalhes")
          );
        }
        if (!j?.sucesso) throw new Error(j?.mensagem || "Erro na adoção");
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
