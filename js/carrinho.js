// ============================================================
// 💙 VARAL DOS SONHOS — js/carrinho.js
// Lógica de visualização, remoção e confirmação de adoção.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  // Elementos principais
  const listaCarrinho = document.getElementById("carrinhoLista");
  const selectPontos = document.getElementById("selectPontos");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnVerMapa = document.getElementById("verNoMapa");
  const feedbackDiv = document.getElementById("feedback");
  const pontosControls = document.getElementById("pontosControls");
  const pontosPlaceholder = document.getElementById("pontosPlaceholder");

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  let pontosDeColetaData = []; // Para armazenar os dados completos dos pontos

  // --- Funções de Estado e UI ---

  // Exibe mensagens de feedback
  const showFeedback = (msg, isError = false) => {
    feedbackDiv.textContent = msg;
    feedbackDiv.className = `feedback ${isError ? 'erro' : 'sucesso'}`;
    feedbackDiv.classList.remove('hidden');
    setTimeout(() => feedbackDiv.classList.add('hidden'), 5000);
  };

  // Atualiza o localStorage e re-renderiza o carrinho
  const updateCarrinho = () => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    exibirCarrinho();
    // Habilita/Desabilita o botão de confirmação
    btnConfirmar.disabled = carrinho.length === 0 || !selectPontos.value;
  };

  // 1️⃣ Exibir e Renderizar Carrinho
  function exibirCarrinho() {
    listaCarrinho.innerHTML = "";
    if (carrinho.length === 0) {
      listaCarrinho.innerHTML = `
        <div class="carrinho-vazio">
          <p>Seu carrinho está vazio 🧺💙</p>
          <a href="cartinhas.html" class="btn btn-primary">Escolher Cartinhas</a>
        </div>
      `;
      btnConfirmar.disabled = true;
      btnLimpar.disabled = true;
      return;
    }
    btnLimpar.disabled = false;
    btnConfirmar.disabled = !selectPontos.value;

    carrinho.forEach((item) => {
      const f = item.fields || {};
      const foto =
        Array.isArray(f.imagem_cartinha) && f.imagem_cartinha[0]
          ? f.imagem_cartinha[0].url
          : "../imagens/sem-foto.png"; // Ajuste o caminho

      const card = document.createElement("div");
      card.className = "card-carrinho";
      card.setAttribute('data-id', item.id); // Usamos o ID do Airtable

      card.innerHTML = `
        <img src="${foto}" alt="Cartinha de ${f.nome_crianca}">
        <h3>${f.nome_crianca || 'Criança'}</h3>
        <p>🎂 ${f.idade || "—"} anos</p>
        ${f.sonho ? `<p>💭 ${f.sonho}</p>` : ""}
        <button class="btn-remover" data-id="${item.id}">❌ Remover</button>
      `;
      listaCarrinho.appendChild(card);
    });
    
    // Adicionar listener de remoção
    listaCarrinho.querySelectorAll('.btn-remover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idToRemove = e.target.getAttribute('data-id');
        carrinho = carrinho.filter(item => item.id !== idToRemove);
        updateCarrinho();
      });
    });
  }

  // 2️⃣ Carregar pontos de coleta
  async function carregarPontos() {
    try {
      const resp = await fetch("/api/pontosdecoleta");
      const json = await resp.json();
      
      if (json.sucesso && json.pontos && json.pontos.length > 0) {
        pontosDeColetaData = json.pontos; // Guarda os dados completos
        
        json.pontos.forEach((p) => {
          // Usamos o nome do ponto como valor e o endereço como data attribute
          const nome = p.nome_ponto || "Ponto Sem Nome";
          const endereco = p.endereco || ""; 
          
          const opt = document.createElement("option");
          opt.value = nome;
          opt.textContent = `${nome} (${p.horario_funcionamento || 'Horário não informado'})`;
          opt.setAttribute('data-endereco', endereco);
          selectPontos.appendChild(opt);
        });
        
        // Exibir os controles de seleção e esconder o placeholder
        pontosControls.classList.remove('hidden');
        pontosPlaceholder.classList.add('hidden');

      } else {
        showFeedback("⚠️ Não foi possível carregar os pontos de coleta.", true);
        pontosPlaceholder.textContent = "Erro ao carregar pontos.";
      }
    } catch (e) {
      console.error("Erro ao carregar pontos:", e);
      showFeedback("❌ Falha na comunicação com a API de Pontos de Coleta.", true);
      pontosPlaceholder.textContent = "Erro ao carregar pontos.";
    }
  }

  // 3️⃣ Modal de Mapa (Google Maps)
  const mapModal = document.getElementById('mapModal');
  const mapFrame = document.getElementById('mapFrame');
  const mapCaption = document.getElementById('mapCaption');

  const abrirModalMapa = (endereco, nome) => {
    // URL básica para busca no Google Maps (usamos o q para pesquisa)
    const mapaURL = `https://www.google.com/maps/embed/v1/search?key=SEU_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(endereco)}`;
    
    mapFrame.src = mapaURL;
    mapCaption.textContent = `📍 ${nome} - ${endereco}`;
    mapModal.classList.add('visivel');
    mapModal.setAttribute('aria-hidden', 'false');
  };
  
  const fecharModalMapa = () => {
    mapModal.classList.remove('visivel');
    mapModal.setAttribute('aria-hidden', 'true');
    mapFrame.src = 'about:blank'; // Limpa o iframe
  };

  // --- Event Listeners ---
  
  // Listener para a seleção do ponto
  selectPontos.addEventListener('change', () => {
    const selectedOption = selectPontos.options[selectPontos.selectedIndex];
    const endereco = selectedOption.getAttribute('data-endereco');
    
    // Habilita o botão do mapa e confirmação
    const isPontoSelecionado = !!selectPontos.value;
    btnVerMapa.disabled = !isPontoSelecionado;
    btnConfirmar.disabled = carrinho.length === 0 || !isPontoSelecionado;
  });

  // Listener para ver o mapa
  btnVerMapa.addEventListener('click', () => {
    const selectedOption = selectPontos.options[selectPontos.selectedIndex];
    const endereco = selectedOption.getAttribute('data-endereco');
    const nome = selectedOption.value;
    if (endereco) {
      abrirModalMapa(endereco, nome);
    }
  });
  
  // Listeners do Modal
  document.getElementById('closeMap').addEventListener('click', fecharModalMapa);
  document.getElementById('mapBackdrop').addEventListener('click', fecharModalMapa);


  // 4️⃣ Confirmar adoção (Ação Final)
  btnConfirmar.addEventListener("click", async () => {
    const ponto = selectPontos.value;
    const cartinhasIDs = carrinho.map(item => item.id);
    
    if (!ponto || carrinho.length === 0) {
      showFeedback("Selecione um ponto e tenha cartinhas no carrinho.", true);
      return;
    }

    // ⚠️ ATENÇÃO: NOME E EMAIL DO DOADOR
    // Aqui você deve implementar a lógica de login/sessão para pegar os dados do doador real.
    // Por enquanto, usamos placeholders:
    const nomeDoador = "Usuário Logado"; 
    const emailDoador = "usuario.logado@seudominio.com";
    
    // Exibir a tela de carregamento/bloqueio antes do FOR
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "⌛ Registrando Adoções...";

    try {
      let sucessoCount = 0;
      for (const item of carrinho) {
        // Payload final com as variáveis do doador logado
        const payload = {
          id_cartinha: item.id,
          nome_doador: nomeDoador, 
          email_doador: emailDoador,
          ponto_coleta: ponto,
        };

        const resp = await fetch("/api/adocoes", { // API a ser criada no Vercel
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (json.sucesso) {
          sucessoCount++;
        } else {
          console.error("Falha ao adotar cartinha:", item.id, json.mensagem);
        }
      }
      
      // Sucesso: Limpar carrinho e feedback final
      if (sucessoCount === carrinho.length) {
        showFeedback(`💙 ${sucessoCount} cartinha(s) adotada(s) com sucesso! Você receberá um email de confirmação.`, false);
        carrinho = []; // Limpa o array local
        updateCarrinho(); // Salva e renderiza
      } else {
        throw new Error("Adoção parcial ou falha no servidor.");
      }
    } catch (erro) {
      console.error("Erro geral no registro de adoção:", erro);
      showFeedback("❌ Erro ao finalizar adoção. Tente novamente.", true);
      btnConfirmar.textContent = "✅ Confirmar Adoção"; // Restaura o botão
      btnConfirmar.disabled = false;
    }
  });
  
  // Listener para Limpar Carrinho
  btnLimpar.addEventListener('click', () => {
    if (confirm("Tem certeza que deseja remover todas as cartinhas do carrinho?")) {
      carrinho = [];
      updateCarrinho();
      showFeedback("Carrinho esvaziado.", false);
    }
  });


  // --- Inicialização ---
  // Verificar Autenticação (Requisito 1)
  // ⚠️ IMPORTANTE: Você precisa implementar a lógica real de login.
  const userIsLoggedIn = true; // Simulação de login para prosseguir com o código.
  if (!userIsLoggedIn) {
    // Redirecionar para a página de login se não estiver autenticado
    // window.location.href = 'login.html'; 
    // return;
  }
  
  exibirCarrinho();
  carregarPontos();
});