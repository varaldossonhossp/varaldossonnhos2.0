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

  // segurança: garante que elementos existam
  if (!listaCartinhas || !selectPonto || !btnFinalizar) {
    console.error("DOM faltando: verifique IDs cartinhaSelecionada, select-ponto ou btn-finalizar.");
    return;
  }

  // ============================================================
  // 1️⃣ Recupera cartinhas do localStorage
  // ============================================================
  let carrinho = [];
  try {
    const raw = localStorage.getItem("carrinho");
    carrinho = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao ler/parsear carrinho do localStorage:", e);
    carrinho = [];
  }

  if (!Array.isArray(carrinho) || carrinho.length === 0) {
    listaCartinhas.innerHTML = `<p>💌 Nenhuma cartinha selecionada.</p><p>Adote uma no Varal Virtual.</p>`;
    btnFinalizar.disabled = true;
    return;
  }

  // Helper: normaliza e extrai dados da cartinha de forma tolerante
  function extractCartData(item) {
    const obj = item || {};
    const fields = obj.fields || {};
    const id =
      obj.id ||
      fields.id ||
      fields.id_cartinha ||
      fields.recordId || // fallback raro
      null;

    const nome_crianca = fields.nome_crianca || fields.nome || obj.nome_crianca || "Criança";
    const sonho = fields.sonho || obj.sonho || "Não informado";

    // tenta múltiplos caminhos para anexos
    const attachments =
      fields.imagem_cartinha || fields.foto || fields.imagem || obj.imagem_cartinha || obj.foto || null;

    const imagem =
      (attachments && Array.isArray(attachments) && attachments[0]?.url) ||
      "../imagens/sem-foto.png";

    return { id, nome_crianca, sonho, imagem, raw: obj };
  }

  listaCartinhas.innerHTML = "";
  // renderiza cartinhas
  carrinho.forEach((item) => {
    const dados = extractCartData(item);
    const card = document.createElement("div");
    card.className = "cartinha-card";
    card.dataset.recordId = dados.id || ""; // guarda id para debug/inspeção
    card.innerHTML = `
      <img src="${dados.imagem}" alt="${dados.nome_crianca}" onerror="this.src='../imagens/sem-foto.png'"/>
      <div>
        <strong>${dados.nome_crianca}</strong>
        <p>Sonho: ${dados.sonho}</p>
      </div>
    `;
    listaCartinhas.appendChild(card);
  });

  // ============================================================
  // 2️⃣ Carrega pontos de coleta com IDs reais
  // ============================================================
  try {
    const resp = await fetch("/api/pontosdecoleta", { cache: "no-store" });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const json = await resp.json();

    // limpa select antes de popular (evita duplicatas)
    selectPonto.innerHTML = '<option value="">Selecione um ponto...</option>';

    let lista = [];
    if (json?.records && Array.isArray(json.records)) {
      lista = json.records.map((r) => ({
        id: r.id,
        nome_ponto: r.fields?.nome_ponto || r.fields?.nome || r.fields?.title || "Ponto",
        endereco: r.fields?.endereco || "",
        telefone: r.fields?.telefone || "",
        email_ponto: r.fields?.email_ponto || ""
      }));
    } else if (Array.isArray(json)) {
      // caso a API retorne array diretamente
      lista = json.map((r) => ({
        id: r.id,
        nome_ponto: r.fields?.nome_ponto || r.fields?.nome || "Ponto",
        endereco: r.fields?.endereco || "",
        telefone: r.fields?.telefone || "",
        email_ponto: r.fields?.email_ponto || ""
      }));
    }

    console.log("🗺️ Pontos carregados:", lista);

    if (lista.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Nenhum ponto de coleta disponível";
      selectPonto.appendChild(opt);
    } else {
      lista.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.nome_ponto;
        opt.dataset.endereco = p.endereco;
        opt.dataset.telefone = p.telefone;
        opt.dataset.email = p.email_ponto;
        selectPonto.appendChild(opt);
      });
    }
  } catch (erro) {
    console.error("❌ Erro ao carregar pontos de coleta:", erro);
    selectPonto.innerHTML = '<option value="">Erro ao carregar pontos (veja console)</option>';
  }

  // ============================================================
  // 3️⃣ Ver localização (abre modal com mapa)
  // ============================================================
  btnVerMapa?.addEventListener("click", () => {
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

  closeMap?.addEventListener("click", () => {
    mapModal.style.display = "none";
    backdrop.style.display = "none";
    mapFrame.src = "";
  });

  backdrop?.addEventListener("click", () => {
    mapModal.style.display = "none";
    backdrop.style.display = "none";
    mapFrame.src = "";
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

    let usuario = {};
    try {
      usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    } catch (e) {
      usuario = {};
    }

    if (!usuario.id) {
      alert("⚠️ Faça login antes de adotar uma cartinha.");
      return;
    }

    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Enviando...";

    try {
      // normaliza ids das cartinhas a enviar
      const cartToSend = carrinho.map((cart) => {
        return {
          id:
            cart.id ||
            cart.fields?.id ||
            cart.fields?.id_cartinha ||
            cart.fields?.recordId ||
            null,
          raw: cart
        };
      }).filter(c => c.id); // remove sem id

      if (!cartToSend.length) throw new Error("Nenhuma cartinha válida encontrada no carrinho.");

      for (const cart of cartToSend) {
        const payload = {
          nome_crianca_id: cart.id,
          nome_usuario_id: usuario.id,
          pontos_coleta_id: pontoId,
        };

        const resp = await fetch("/api/adocoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        console.log("Resposta /api/adocoes:", resp.status, json);

        if (!resp.ok || !json.success) {
          const msg = json?.message || json?.mensagem || json?.error || JSON.stringify(json);
          throw new Error(msg);
        }
      }

      mostrarMensagemFinal(
        "💙 Todas as adoções foram registradas com sucesso!<br>O administrador foi notificado por e-mail."
      );
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "../index.html"), 5000);
    } catch (erro) {
      console.error("❌ Erro ao finalizar adoção:", erro);
      alert("Erro ao concluir a adoção. Verifique o console e as respostas das APIs.");
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
// Função de mensagem final
// ============================================================
function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  if (!container) {
    alert(msg.replace(/<br>/g, "\n"));
    return;
  }
  container.innerHTML = `
    <div class="mensagem-final">
      <img src="../imagens/logo.png" alt="Varal dos Sonhos" width="200" />
      <p>${msg}</p>
      <a href="../index.html">Voltar ao Início</a>
    </div>
  `;
}
