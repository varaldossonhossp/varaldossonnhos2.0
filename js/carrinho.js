// ============================================================
// 💙 VARAL DOS SONHOS — js/carrinho.js (compatível com IDs Airtable)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const listaCartinhas = document.getElementById("cartinhaSelecionada");
  const selectPonto = document.getElementById("select-ponto");
  const btnFinalizar = document.getElementById("btn-finalizar");
  const btnLimpar = document.getElementById("btn-limpar");

  // ============================================================
  // 1️⃣ Recupera carrinho
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
      dados.imagem_cartinha?.[0]?.url || "../imagens/sem-foto.png";
    listaCartinhas.innerHTML += `
      <div class="cartinha-card">
        <img src="${imagem}" alt="${dados.nome_crianca}" />
        <div>
          <strong>${dados.nome_crianca}</strong>
          <p>Sonho: ${dados.sonho}</p>
        </div>
      </div>
    `;
  });

// ============================================================
// 2️⃣ Carrega pontos de coleta — compatível com todos os formatos
// ============================================================
try {
  const resp = await fetch("/api/pontosdecoleta", { cache: "no-store" });
  const json = await resp.json();

  let lista = [];

  // 🔍 1. Formato padrão do Airtable
  if (json?.records && Array.isArray(json.records)) {
    lista = json.records.map((r) => ({
      id: r.id,
      nome_ponto: r.fields?.nome_ponto || "Ponto sem nome",
      endereco: r.fields?.endereco || "",
      telefone: r.fields?.telefone || "",
      email_ponto: r.fields?.email_ponto || "",
    }));
  }
  // 🔍 2. Caso o backend devolva array direto
  else if (Array.isArray(json)) {
    lista = json;
  }
  // 🔍 3. Caso venha dentro de outro campo (ex: { pontos: [...] })
  else if (Array.isArray(json?.pontos)) {
    lista = json.pontos;
  }
  // 🔍 4. Caso venha dentro de { data: [...] }
  else if (Array.isArray(json?.data)) {
    lista = json.data;
  }

  console.log("🗺️ Pontos carregados:", lista); // 👀 Log no console para debug

  // Monta o select
  if (lista.length > 0) {
    lista.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id || "";
      opt.textContent = p.nome_ponto || "Sem nome";
      opt.dataset.endereco = p.endereco || "";
      opt.dataset.telefone = p.telefone || "";
      opt.dataset.email = p.email_ponto || "";
      selectPonto.appendChild(opt);
    });
  } else {
    selectPonto.innerHTML = "<option>Nenhum ponto de coleta disponível</option>";
  }
} catch (erro) {
  console.error("❌ Erro ao carregar pontos de coleta:", erro);
  selectPonto.innerHTML = "<option>Erro ao carregar pontos</option>";
}


  // ============================================================
  // 3️⃣ Finaliza adoção
  // ============================================================
  btnFinalizar.addEventListener("click", async () => {
    const pontoId = selectPonto.value;
    if (!pontoId || pontoId === "Selecione um ponto...") {
      alert("⚠️ Escolha um ponto de coleta antes de finalizar.");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    if (!usuario.id) {
      alert("⚠️ Faça login antes de adotar.");
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
        if (!json.sucesso) throw new Error(json.mensagem);
      }

      mostrarMensagemFinal(
        "💙 Adoção registrada com sucesso!<br>O administrador foi notificado por e-mail."
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
      <img src="../imagens/logo.png" width="180" />
      <p>${msg}</p>
      <a href="../index.html">Voltar ao Início</a>
    </div>
  `;
}
