// js/carrinho.js
// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js
// ------------------------------------------------------------
// Lógica para listar cartinhas no carrinho, seleção de ponto de coleta e submissão da adoção.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const carrinhoLista = document.getElementById("carrinhoLista");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const feedback = document.getElementById("feedback");

  const pontosPlaceholder = document.getElementById("pontosPlaceholder");
  const pontosControls = document.getElementById("pontosControls");
  const selectPontos = document.getElementById("selectPontos");
  const verNoMapa = document.getElementById("verNoMapa");

  // modal mapa.
  const mapModal = document.getElementById("mapModal");
  const mapFrame = document.getElementById("mapFrame");
  const closeMap = document.getElementById("closeMap");
  const mapBackdrop = document.getElementById("mapBackdrop");
  const mapCaption = document.getElementById("mapCaption");

  // Usuário (exige login)
  const usuario = JSON.parse(localStorage.getItem("usuario")) || JSON.parse(localStorage.getItem("nomeUsuario") ? JSON.stringify({ nome: localStorage.getItem("nomeUsuario"), email: localStorage.getItem("usuarioEmail") || "" }) : null);
  
  if (!usuario || !usuario.email) {
    alert("Você precisa estar logado para acessar o carrinho.");
    window.location.href = "login.html";
    return;
  }

  // Carrega carrinho
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  function renderCarrinho() {
    carrinhoLista.innerHTML = "";
    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      carrinhoLista.innerHTML = "<p>Seu carrinho está vazio 😢</p>";
      pontosControls.classList.add("hidden"); // Esconde se vazio
      btnLimpar.classList.add("hidden");
      btnConfirmar.classList.add("hidden");
      return;
    }

    carrinho.forEach((item, index) => {
      const nome = item.nome || item.primeiro_nome || "Criança";
      const imagem = item.imagem || item.imagem_cartinha || "imagens/sem-imagem.jpg";
      const idade = item.idade || item.age || "";
      const sexo = item.sexo || item.gender || "";

      const div = document.createElement("div");
      div.className = "carrinho-item";
      div.innerHTML = `
        <img src="${imagem}" alt="${nome}" class="cartinha-foto" />
        <h3>${nome}</h3>
        <p>${idade ? `<strong>Idade:</strong> ${idade} anos` : ""} ${sexo ? `<strong>Sexo:</strong> ${sexo}` : ""}</p>
        <p class="mini">${item.sonho ? `<strong>Sonho:</strong> ${item.sonho}` : ""}</p>
        <button class="remover" data-index="${index}">Remover</button>
      `;
      carrinhoLista.appendChild(div);
    });
    
    // Mostra os controles se houver itens
    pontosControls.classList.remove("hidden");
    btnLimpar.classList.remove("hidden");
    btnConfirmar.classList.remove("hidden");
  }

  renderCarrinho();

  // remover item
  carrinhoLista.addEventListener("click", (e) => {
    if (e.target.classList.contains("remover")) {
      const idx = Number(e.target.dataset.index);
      carrinho.splice(idx, 1);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      renderCarrinho();
      checkConfirmEnabled();
    }
  });

  // limpar carrinho
  btnLimpar.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar o carrinho?")) {
      carrinho = [];
      localStorage.removeItem("carrinho");
      renderCarrinho();
      checkConfirmEnabled();
    }
  });

  // carregar pontos do servidor (API)
  async function carregarPontos() {
    pontosPlaceholder.classList.remove("hidden");
    pontosControls.classList.add("hidden");
    try {
      const resp = await fetch("/api/pontosdecoleta");
      if (!resp.ok) throw new Error("Erro ao buscar pontos");
      const pontos = await resp.json();
      popularSelectPontos(pontos.pontos); // Ajustado para a estrutura da API
    } catch (err) {
      console.error("Erro pontos:", err);
      pontosPlaceholder.textContent = "Não foi possível carregar os pontos. Tente novamente mais tarde.";
    }
  }

  function popularSelectPontos(pontos = []) {
    const pontosAtivos = pontos.filter(p => p.status && p.status.toLowerCase() === 'ativo');

    if (!Array.isArray(pontosAtivos) || pontosAtivos.length === 0) {
      pontosPlaceholder.textContent = "Nenhum ponto de coleta disponível.";
      return;
    }

    // limpa select preservando primeiro option
    selectPontos.innerHTML = '<option value="">-- Selecione um ponto de coleta --</option>';
    pontosAtivos.forEach((p, i) => {
      const opt = document.createElement("option");
      // guardamos o endereço e id no value (json string)
      const payload = {
        id: p.id || p.nome_local || i,
        nome: p.nome_ponto || p.nome || "Ponto",
        endereco: `${p.endereco || ""}, ${p.cidade || ""}`, // Cria o endereço completo
      };
      opt.value = JSON.stringify(payload);
      opt.textContent = `${payload.nome} — ${payload.endereco}`;
      selectPontos.appendChild(opt);
    });

    pontosPlaceholder.classList.add("hidden");
    pontosControls.classList.remove("hidden");
  }

  // ver no mapa
  verNoMapa.addEventListener("click", () => {
    const val = selectPontos.value;
    if (!val) return;
    const payload = JSON.parse(val);
    abrirMapa(payload.endereco, payload.nome);
  });

  // abrir mapa (modal)
  function abrirMapa(endereco, nome = "") {
    // 🔑 Usando a URL de pesquisa do Google Maps que NÃO requer a chave de API
    const url = `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;
    
    mapFrame.src = url;
    mapCaption.textContent = nome || endereco;
    mapModal.classList.add("aberto");
    mapModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = 'hidden'; // Bloqueia o scroll
  }

  // fechar modal mapa
  function fecharMapa() {
    mapModal.classList.remove("aberto");
    mapModal.setAttribute("aria-hidden", "true");
    mapFrame.src = "about:blank";
    document.body.style.overflow = ''; // Restaura o scroll
  }

  closeMap.addEventListener("click", fecharMapa);
  mapBackdrop.addEventListener("click", fecharMapa);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mapModal.classList.contains("aberto")) fecharMapa();
  });

  // habilitar/desabilitar ver no mapa e confirmar
  selectPontos.addEventListener("change", () => {
    verNoMapa.disabled = !selectPontos.value;
    checkConfirmEnabled();
  });

  function checkConfirmEnabled() {
    // Confirmar habilitado apenas se 1) carrinho tem itens e 2) ponto selecionado
    const pontoSelecionado = !!selectPontos.value;
    btnConfirmar.disabled = !(carrinho.length > 0 && pontoSelecionado);
  }

  // confirmar adoção
  btnConfirmar.addEventListener("click", async () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    if (!selectPontos.value) {
      alert("Por favor, selecione um ponto de coleta para continuar.");
      return;
    }

    // pega os dados do ponto
    const ponto = JSON.parse(selectPontos.value);

    // montar payload — conforme sua API /api/adocoes espera
    // Ajuste para mapear os campos que a sua API /api/adocoes.js usa
    const payload = {
      id_usuario: usuario.id || "doador_sem_id", // Se o ID do usuário não estiver salvo, use um placeholder
      nome_doador: usuario.nome,
      email_doador: usuario.email,
      telefone_doador: localStorage.getItem("usuarioTelefone") || "N/A",
      ponto_coleta: ponto.nome || ponto.endereco || "",
    };
    
    // UX: feedback e desabilitar botões
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Enviando...";
    feedback.classList.add("hidden");

    let sucessoTotal = true;
    let cartinhasSucesso = 0;
    
    // Itera por cada cartinha no carrinho e envia uma requisição de adoção separada
    for (const item of carrinho) {
        // Campos que a API /api/adocoes.js precisa (id_cartinha, nome_crianca, sonho)
        const cartinhaPayload = {
            ...payload,
            id_cartinha: item.id || item.id_cartinha || item.recordId, // Tenta usar o ID da cartinha
            nome_crianca: item.nome || item.primeiro_nome || "Criança",
            sonho: item.sonho || item.descricao || "Um presente",
        };

        try {
            const resp = await fetch("/api/adocoes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cartinhaPayload)
            });

            const data = await resp.json();

            if (resp.ok && data.sucesso) {
                cartinhasSucesso++;
            } else {
                console.error(`Erro ao adotar cartinha ${cartinhaPayload.id_cartinha}:`, data);
                sucessoTotal = false;
            }
        } catch (err) {
            console.error("Erro de conexão ao adotar:", err);
            sucessoTotal = false;
        }
    }


    if (sucessoTotal) {
        // calcular pontuação (exemplo local): 10 pts por cartinha
        const pontosGanhos = cartinhasSucesso * 10;
        
        // Simulação de gamificação local
        const pontuacaoAtual = Number(localStorage.getItem("cloudinho_pontos") || 0);
        const novaPontuacao = pontuacaoAtual + pontosGanhos;
        localStorage.setItem("cloudinho_pontos", String(novaPontuacao));

        // mostrar confirmação
        alert(`💙 Adoção confirmada! ${cartinhasSucesso} cartinha(s) registradas com sucesso. Você ganhou ${pontosGanhos} pts de gamificação (total: ${novaPontuacao} pts). Verifique seu email para mais detalhes.`);
        
        // limpar carrinho
        localStorage.removeItem("carrinho");
        
        // redirecionar
        window.location.href = "index.html";
    } else {
        const msg = cartinhasSucesso > 0 
          ? `⚠️ Adoção parcial. ${cartinhasSucesso} cartinha(s) foram registradas, mas houve falha nas demais. Tente novamente ou entre em contato.`
          : "❌ Erro grave ao registrar adoções. Tente novamente mais tarde.";

        alert(msg);
        
        // Recarrega para mostrar as cartinhas que falharam (se não foram removidas do carrinho)
        window.location.reload(); 
    }
  });

  // iniciar
  carregarPontos();
  checkConfirmEnabled();
});