// ============================================================
// 💙 VARAL DOS SONHOS — /js/pontosdecoleta.js
// ------------------------------------------------------------
// Página: Pontos de Coleta
// Funções:
//   • Buscar os pontos de coleta da API (/api/pontosdecoleta)
//   • Renderizar cards no carrossel horizontal
//   • Abrir modal com mapa (sem necessidade de chave API)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    carregarPontosDeColeta();
    setupModalListeners();
});

// ------------------------------------------------------------
// 🗺️ VARIÁVEIS GLOBAIS (modal de mapa)
// ------------------------------------------------------------
const mapModal = document.getElementById('mapModal');
const mapFrame = document.getElementById('mapFrame');
const closeModalBtn = document.getElementById('closeModal');

// ------------------------------------------------------------
// 🔹 EVENTOS DO MODAL (abrir, fechar, esc, clique fora)
// ------------------------------------------------------------
function setupModalListeners() {
    // 1. Botão "X" fecha o modal
    closeModalBtn.addEventListener('click', fecharModal);

    // 2. Clicar fora da área do modal também fecha
    mapModal.addEventListener('click', (e) => {
        if (e.target === mapModal) fecharModal();
    });

    // 3. Pressionar ESC fecha o modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapModal.classList.contains('is-open')) {
            fecharModal();
        }
    });
}

// ------------------------------------------------------------
// 📍 ABRIR MODAL COM MAPA DO GOOGLE (SEM CHAVE DE API)
// ------------------------------------------------------------
/**
 * Abre o modal e carrega o mapa com base no endereço.
 * @param {string} endereco Endereço completo do ponto de coleta
 */
function abrirModalMapa(endereco) {
    const enderecoFormatado = encodeURIComponent(endereco);

    // ✅ URL pública do Google Maps (não requer API key)
    const mapsUrl = `https://maps.google.com/maps?q=${enderecoFormatado}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    mapFrame.src = mapsUrl;
    mapModal.classList.add('is-open');
    mapModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // trava scroll do body
}

// ------------------------------------------------------------
// ❌ FECHAR MODAL E LIMPAR MAPA
// ------------------------------------------------------------
function fecharModal() {
    mapModal.classList.remove('is-open');
    mapModal.setAttribute('aria-hidden', 'true');
    mapFrame.src = ""; // limpa iframe para evitar carregamento contínuo
    document.body.style.overflow = ''; // restaura scroll
}

// ------------------------------------------------------------
// 💾 BUSCAR E EXIBIR PONTOS DE COLETA (API → HTML)
// ------------------------------------------------------------
async function carregarPontosDeColeta() {
    const listaPontos = document.getElementById("lista-pontos");
    const statusMsg = document.getElementById("mensagem-status");

    listaPontos.innerHTML = "<p style='text-align:center;'>Buscando pontos de coleta...</p>";
    statusMsg.style.display = 'none';

    try {
        const resposta = await fetch("/api/pontosdecoleta");

        if (!resposta.ok) {
            const texto = await resposta.text();
            throw new Error(`Falha ao carregar. Status: ${resposta.status}. Resposta: ${texto.substring(0, 80)}...`);
        }

        const dados = await resposta.json();

        if (!dados.sucesso || !Array.isArray(dados.pontos)) {
            throw new Error("A resposta da API não contém dados válidos.");
        }

        const pontosAtivos = dados.pontos.filter(p => 
            p.status && p.status.toLowerCase() === 'ativo'
        );

        // Nenhum ponto ativo
        if (pontosAtivos.length === 0) {
            listaPontos.innerHTML = "";
            statusMsg.textContent = "Nenhum ponto de coleta ativo encontrado no momento.";
            statusMsg.style.display = 'block';
            return;
        }

        // Cria os cards
        const htmlCards = pontosAtivos.map(ponto => {
            const enderecoCompleto = `${ponto.endereco}, ${ponto.nome_ponto}`;

            return `
                <div class="card-ponto">
                    <img src="../imagens/prendedor.png" alt="Prendedor" class="prendedor-card">
                    <h3>${ponto.nome_ponto}</h3>
                    <p><strong>Endereço:</strong> ${ponto.endereco}</p>
                    <p><strong>Horário:</strong> ${ponto.horario_funcionamento || ponto.horario || "—"}</p>
                    <p><strong>Responsável:</strong> ${ponto.responsavel}</p>
                    <p><strong>Telefone:</strong> ${ponto.telefone}</p>
                    <button class="btn-localizacao" data-endereco="${enderecoCompleto}">
                        📍 Localização no Mapa
                    </button>
                </div>
            `;
        }).join("");

        listaPontos.innerHTML = htmlCards;

        // Adiciona eventos de clique nos botões
        document.querySelectorAll('.btn-localizacao').forEach(button => {
            button.addEventListener('click', (e) => {
                const endereco = e.currentTarget.getAttribute('data-endereco');
                abrirModalMapa(endereco);
            });
        });

    } catch (erro) {
        console.error("⚠️ Erro ao carregar pontos de coleta:", erro);
        listaPontos.innerHTML = "";
        statusMsg.textContent = `Erro ao tentar carregar os pontos de coleta. Detalhe: ${erro.message}`;
        statusMsg.style.display = 'block';
    }
}
