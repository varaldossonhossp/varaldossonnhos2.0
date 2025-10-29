// ============================================================
// 💙 VARAL DOS SONHOS — /js/pontosdecoleta.js (Com Modal)
// ------------------------------------------------------------
// Lógica para buscar, renderizar os pontos de coleta e gerenciar o modal de mapa.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    carregarPontosDeColeta();
    setupModalListeners();
});

// Variáveis Globais do Modal
const mapModal = document.getElementById('mapModal');
const mapFrame = document.getElementById('mapFrame');
const closeModalBtn = document.getElementById('closeModal');

function setupModalListeners() {
    // 1. Fechar com o botão 'X'
    closeModalBtn.addEventListener('click', fecharModal);

    // 2. Fechar ao clicar fora do modal
    mapModal.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            fecharModal();
        }
    });

    // 3. Fechar com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapModal.classList.contains('is-open')) {
            fecharModal();
        }
    });
}

/**
 * Abre o modal e carrega o mapa com base no endereço.
 * @param {string} endereco O endereço completo do ponto de coleta.
 */
function abrirModalMapa(endereco) {
    const enderecoFormatado = encodeURIComponent(endereco);
    
    // URL do Google Maps Embed (exige uma chave de API para produção, mas funciona em dev com o endereço)
    // Usaremos a URL de busca direta, que geralmente funciona sem a chave de embed, 
    // mas o iframe do Google Maps pode requerer a chave.
    // O ideal é a API Embed do Google Maps (iframe):
    const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?q=${enderecoFormatado}&key=SUA_CHAVE_API_GOOGLE_AQUI`;
    
    // Para teste sem chave, podemos tentar a URL de pesquisa, que geralmente abre bem em iframes simples:
    const mapsSearchUrl = `https://maps.google.com/maps?q=${enderecoFormatado}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    mapFrame.src = mapsSearchUrl;
    mapModal.classList.add('is-open');
    mapModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Bloqueia o scroll do body
}

function fecharModal() {
    mapModal.classList.remove('is-open');
    mapModal.setAttribute('aria-hidden', 'true');
    mapFrame.src = ""; // Limpa o iframe para parar carregamento/áudio
    document.body.style.overflow = ''; // Restaura o scroll do body
}

// ... Sua função carregarPontosDeColeta agora com o botão de modal ...
async function carregarPontosDeColeta() {
    const listaPontos = document.getElementById("lista-pontos");
    const statusMsg = document.getElementById("mensagem-status");
    listaPontos.innerHTML = "<p style='text-align:center;'>Buscando pontos de coleta no servidor...</p>";
    statusMsg.style.display = 'none';

    try {
        const resposta = await fetch("/api/pontosdecoleta");
        
        // Trata o erro 404/500
        if (!resposta.ok) {
            const errorText = await resposta.text();
            throw new Error(`Falha no servidor. Status: ${resposta.status}. Resposta: ${errorText.substring(0, 50)}...`);
        }
        
        const dados = await resposta.json();

        if (!dados.sucesso || !dados.pontos || dados.pontos.length === 0) {
            throw new Error("API retornou sem sucesso ou lista vazia.");
        }

        const pontosAtivos = dados.pontos.filter(p => p.status && p.status.toLowerCase() === 'ativo');

        if (pontosAtivos.length === 0) {
            listaPontos.innerHTML = "";
            statusMsg.textContent = "Nenhum ponto de coleta ativo encontrado no momento.";
            statusMsg.style.display = 'block';
            return;
        }

        const htmlCards = pontosAtivos.map(ponto => {
            // Usa o endereço completo no botão
            const enderecoCompleto = `${ponto.endereco}, ${ponto.nome_ponto}`;

            return `
                <div class="card-ponto">
                    <img src="../imagens/prendedor.png" alt="Prendedor" class="prendedor-card">
                    <h3>${ponto.nome_ponto}</h3>
                    <p><strong>Endereço:</strong> ${ponto.endereco}</p>
                    <p><strong>Horário:</strong> ${ponto.horario_funcionamento}</p>
                    <p><strong>Responsável:</strong> ${ponto.responsavel}</p>
                    <p><strong>Telefone:</strong> ${ponto.telefone}</p>
                    
                    <button class="btn-localizacao" 
                            data-endereco="${enderecoCompleto}">
                        📍 Localização no Mapa
                    </button>
                </div>
            `;
        }).join("");

        listaPontos.innerHTML = htmlCards;

        // Adiciona o listener para os novos botões do mapa
        document.querySelectorAll('.btn-localizacao').forEach(button => {
            button.addEventListener('click', (e) => {
                const endereco = e.target.getAttribute('data-endereco');
                abrirModalMapa(endereco);
            });
        });

    } catch (erro) {
        console.error("Falha detalhada ao carregar pontos de coleta:", erro);
        listaPontos.innerHTML = "";
        statusMsg.textContent = `⚠️ Houve um erro ao tentar carregar os pontos de coleta. Detalhe: ${erro.message}`;
        statusMsg.style.display = 'block';
    }
}