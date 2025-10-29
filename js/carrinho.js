// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (Completo)
// ------------------------------------------------------------
// Lógica para listar cartinhas no carrinho, seleção de ponto de coleta e submissão da adoção.
// ============================================================

// --- 1. Variáveis e Configuração do DOM ---
const carrinhoLista = document.getElementById('carrinho-lista');
const selectPontos = document.getElementById('selectPontos');
const btnConfirmar = document.getElementById('btnConfirmarAdocao');
const btnLimpar = document.getElementById('btnLimparCarrinho');
const feedbackMsg = document.getElementById('feedback-msg');
const acoesContainer = document.querySelector('.acoes');

// Variáveis Globais do Modal
const mapModal = document.getElementById('mapModal');
const mapFrame = document.getElementById('mapFrame');
const closeModalBtn = document.getElementById('closeModal');
const mapCaption = document.getElementById('mapCaption'); // Adicionado para exibir o nome

// --- 2. Funções de Utilidade (Modal) ---

function setupModalListeners() {
    closeModalBtn.addEventListener('click', fecharModal);
    mapModal.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            fecharModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapModal.classList.contains('is-open')) {
            fecharModal();
        }
    });
}

/**
 * Abre o modal e carrega o mapa com base no endereço.
 * @param {string} endereco O endereço completo do ponto de coleta.
 * @param {string} nomePonto O nome do ponto de coleta.
 */
function abrirModalMapa(endereco, nomePonto) {
    const GOOGLE_MAPS_KEY = "SUA_CHAVE_API_GOOGLE_AQUI"; // 🚨 OBRIGATÓRIO: Use sua chave real!
    const enderecoFormatado = encodeURIComponent(endereco);
    
    // Usando a URL de pesquisa, mas se a chave for válida, use a URL Embed do Maps
    // A API Embed exige o parâmetro 'key' e o 'q' para pesquisa de endereço.
    // É altamente recomendado que você use a URL de Embed API:
    const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${enderecoFormatado}`;

    mapFrame.src = mapsEmbedUrl; // Use a URL com a sua chave
    mapCaption.textContent = `📍 ${nomePonto} - ${endereco}`; // Exibe o nome
    mapModal.classList.add('is-open');
    mapModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    mapModal.classList.remove('is-open');
    mapModal.setAttribute('aria-hidden', 'true');
    mapFrame.src = "";
    document.body.style.overflow = '';
}

// --- 3. Gerenciamento do Carrinho (LocalStorage) ---

const getCarrinho = () => JSON.parse(localStorage.getItem('carrinho_adocoes') || '[]');
const setCarrinho = (carrinho) => localStorage.setItem('carrinho_adocoes', JSON.stringify(carrinho));

function renderizarCarrinho() {
    const carrinho = getCarrinho();
    carrinhoLista.innerHTML = ''; // Limpa a lista atual

    if (carrinho.length === 0) {
        carrinhoLista.innerHTML = `
            <div class="carrinho-vazio">
                <p>O seu Varal de Sonhos está vazio. 😔</p>
                <p>Que tal escolher uma cartinha para adotar?</p>
                <a href="./cartinhas.html" class="btn btn-outline">Ir para o Varal Virtual</a>
            </div>
        `;
        // Esconde os controles de ponto de coleta e ações
        document.querySelector('.pontos-box').classList.add('hidden');
        acoesContainer.classList.add('hidden');
        return;
    }

    // Mostra os controles
    document.querySelector('.pontos-box').classList.remove('hidden');
    acoesContainer.classList.remove('hidden');

    const htmlCards = carrinho.map(item => `
        <div class="card-carrinho" data-id="${item.id}">
            <img src="${item.fotoUrl || '../imagens/cartinha-placeholder.jpg'}" alt="Foto da Cartinha">
            <h3>${item.nome} (${item.idade} anos)</h3>
            <p>Sonho: **${item.sonho}**</p>
            <p>Irmãos: ${item.irmaos ? 'Sim' : 'Não'} (${item.idadeIrmaos || 0})</p>
            <button class="btn-remover" data-id="${item.id}">Remover</button>
        </div>
    `).join('');

    carrinhoLista.innerHTML = htmlCards;
    
    // Adiciona listener para os botões de remover
    document.querySelectorAll('.btn-remover').forEach(button => {
        button.addEventListener('click', removerDoCarrinho);
    });

    // Atualiza o estado do botão de confirmar
    atualizarEstadoBotao();
}

function removerDoCarrinho(e) {
    const idRemover = e.target.getAttribute('data-id');
    let carrinho = getCarrinho();
    
    // Remove apenas a cartinha com o ID clicado
    const novoCarrinho = carrinho.filter(item => item.id !== idRemover);
    setCarrinho(novoCarrinho);
    
    renderizarCarrinho(); // Renderiza novamente
    exibirFeedback('Item removido com sucesso.', 'sucesso');
}

function limparCarrinho() {
    if (confirm("Tem certeza que deseja limpar o carrinho?")) {
        setCarrinho([]);
        renderizarCarrinho();
        exibirFeedback('Carrinho limpo.', 'sucesso');
    }
}

// --- 4. Carregamento e Seleção de Pontos de Coleta ---

async function carregarPontosDeColeta() {
    try {
        const resposta = await fetch("/api/pontosdecoleta");
        
        if (!resposta.ok) throw new Error(`Status: ${resposta.status}`);
        
        const dados = await resposta.json();

        if (!dados.sucesso || !dados.pontos || dados.pontos.length === 0) {
            selectPontos.innerHTML = '<option value="">Nenhum ponto ativo.</option>';
            return;
        }

        const pontosAtivos = dados.pontos.filter(p => p.status && p.status.toLowerCase() === 'ativo');
        
        selectPontos.innerHTML = '<option value="" disabled selected>Selecione um ponto de coleta...</option>';
        
        pontosAtivos.forEach(ponto => {
            // Valor: o endereço completo para envio na API e uso no mapa
            const enderecoCompleto = `${ponto.nome_ponto} - ${ponto.endereco}, ${ponto.cidade} - ${ponto.estado}`;
            const option = document.createElement('option');
            option.value = enderecoCompleto; 
            option.textContent = `${ponto.nome_ponto} (${ponto.cidade})`;
            // Armazena todos os dados do ponto para facilitar o modal
            option.dataset.nome = ponto.nome_ponto;
            option.dataset.endereco = ponto.endereco;
            selectPontos.appendChild(option);
        });

    } catch (erro) {
        console.error("Falha ao carregar pontos de coleta:", erro);
        selectPontos.innerHTML = '<option value="">Erro ao carregar (Tente novamente)</option>';
    }
}

// --- 5. Ações e Feedback ---

function exibirFeedback(mensagem, tipo = 'sucesso') {
    feedbackMsg.textContent = mensagem;
    feedbackMsg.className = `feedback ${tipo}`; // Define a classe (sucesso ou erro)
    feedbackMsg.classList.remove('hidden');

    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
        feedbackMsg.classList.add('hidden');
    }, 5000);
}

function atualizarEstadoBotao() {
    const carrinho = getCarrinho();
    const pontoSelecionado = selectPontos.value;

    if (carrinho.length > 0 && pontoSelecionado) {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = `Confirmar Adoção de ${carrinho.length} Cartinha(s)`;
    } else {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Selecione o Ponto de Coleta';
    }
}

// --- 6. Submissão da Adoção ---

async function confirmarAdocao() {
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Processando... ⏳';

    const id_usuario = localStorage.getItem('id_usuario_varal'); // 🚨 Mudar conforme sua lógica de login
    const nome_doador = localStorage.getItem('nome_usuario_varal'); // 🚨 Mudar conforme sua lógica de login
    const email_doador = localStorage.getItem('email_usuario_varal'); // 🚨 Mudar conforme sua lógica de login
    // Telefone será opcional.

    if (!id_usuario || !email_doador) {
        exibirFeedback("Você precisa estar logado para confirmar a adoção.", 'erro');
        btnConfirmar.textContent = 'Faça Login';
        btnConfirmar.addEventListener('click', () => window.location.href = './login.html', { once: true });
        return;
    }

    const carrinho = getCarrinho();
    const ponto_coleta = selectPontos.value;

    if (carrinho.length === 0 || !ponto_coleta) {
        exibirFeedback("Carrinho vazio ou ponto de coleta não selecionado.", 'erro');
        atualizarEstadoBotao();
        return;
    }

    // Itera sobre todas as cartinhas no carrinho
    for (const cartinha of carrinho) {
        const payload = {
            id_cartinha: cartinha.id,
            id_usuario: id_usuario,
            nome_doador: nome_doador,
            email_doador: email_doador,
            telefone_doador: "N/A", // Se não coletamos, use N/A
            ponto_coleta: ponto_coleta,
            // (nome_crianca e sonho não são mais necessários, a API ajustada busca)
        };

        try {
            const resposta = await fetch('/api/adocoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const dados = await resposta.json();

            if (!dados.sucesso) {
                // Se uma falhar, exibe o erro e para o loop
                throw new Error(dados.mensagem || 'Erro desconhecido ao registrar adoção.');
            }
        } catch (erro) {
            exibirFeedback(`Falha ao adotar a cartinha: ${erro.message}`, 'erro');
            // Mantém o botão desabilitado em caso de erro grave no servidor
            return;
        }
    }

    // Se todas as adoções foram bem-sucedidas:
    setCarrinho([]); // Esvazia o carrinho
    renderizarCarrinho(); // Atualiza a visualização
    exibirFeedback('🎉 Parabéns! Suas adoções foram registradas com sucesso! Verifique seu e-mail para os próximos passos.', 'sucesso');
    btnConfirmar.textContent = 'Sucesso!';
}

// --- 7. Inicialização ---

document.addEventListener("DOMContentLoaded", () => {
    // 1. Configura os listeners do Modal (copiado do pontosdecoleta.js)
    setupModalListeners();

    // 2. Carrega e renderiza o carrinho e os pontos de coleta
    renderizarCarrinho();
    carregarPontosDeColeta();

    // 3. Configura os listeners principais
    selectPontos.addEventListener('change', atualizarEstadoBotao);
    btnConfirmar.addEventListener('click', confirmarAdocao);
    btnLimpar.addEventListener('click', limparCarrinho);

    // Listener do botão de mapa no seletor de pontos
    document.getElementById('btnVerMapa').addEventListener('click', (e) => {
        const selectedOption = selectPontos.options[selectPontos.selectedIndex];
        
        if (selectedOption && selectedOption.value) {
            const nomePonto = selectedOption.dataset.nome || 'Ponto de Coleta Selecionado';
            abrirModalMapa(selectedOption.value, nomePonto);
        } else {
            exibirFeedback('Selecione um ponto de coleta primeiro.', 'erro');
        }
    });

    // 4. Garante que o estado inicial do botão esteja correto
    atualizarEstadoBotao();
});