// ============================================================
// 💙 VARAL DOS SONHOS — /js/pontosdecoleta.js
// ------------------------------------------------------------
// Lógica para buscar e renderizar os pontos de coleta.
// Requer: /api/pontosdecoleta.js
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    carregarPontosDeColeta();
});

/**
 * Busca os dados dos pontos de coleta da API e os renderiza na tela.
 */
async function carregarPontosDeColeta() {
    const listaPontos = document.getElementById("lista-pontos");
    const statusMsg = document.getElementById("mensagem-status");
    listaPontos.innerHTML = "<p>Buscando pontos de coleta no servidor...</p>";

    try {
        // Chamada para a API (que, no Vercel, fica na raiz do projeto)
        const resposta = await fetch("/api/pontosdecoleta");
        const dados = await resposta.json();

        if (!dados.sucesso || !dados.pontos || dados.pontos.length === 0) {
            throw new Error("API retornou sem sucesso ou lista vazia.");
        }

        // Filtra apenas pontos com status 'ativo' (ou outro critério de visibilidade se existir)
        const pontosAtivos = dados.pontos.filter(p => p.status && p.status.toLowerCase() === 'ativo');

        if (pontosAtivos.length === 0) {
            listaPontos.innerHTML = "";
            statusMsg.textContent = "Nenhum ponto de coleta ativo encontrado no momento.";
            statusMsg.style.display = 'block';
            return;
        }

        // Gera o HTML dos cards
        const htmlCards = pontosAtivos.map(ponto => {
            // Cria um link do Google Maps com o endereço
            const enderecoFormatado = encodeURIComponent(ponto.endereco + ", " + ponto.nome_ponto);
            const linkMaps = `https://www.google.com/maps/search/?api=1&query=${enderecoFormatado}`;

            return `
                <div class="card-ponto">
                    <img src="../imagens/prendedor.png" alt="Prendedor" class="prendedor-card">
                    <h3>${ponto.nome_ponto}</h3>
                    <p><strong>Endereço:</strong> ${ponto.endereco}</p>
                    <p><strong>Horário:</strong> ${ponto.horario_funcionamento}</p>
                    <p><strong>Responsável:</strong> ${ponto.responsavel}</p>
                    <p><strong>Telefone:</strong> ${ponto.telefone}</p>
                    
                    <a href="${linkMaps}" target="_blank" class="btn-localizacao">
                        📍 Localização no Mapa
                    </a>
                </div>
            `;
        }).join("");

        listaPontos.innerHTML = htmlCards;
        statusMsg.style.display = 'none'; // Esconde a mensagem de status se deu tudo certo

    } catch (erro) {
        console.error("Falha ao carregar pontos de coleta:", erro);
        listaPontos.innerHTML = "";
        statusMsg.textContent = "⚠️ Houve um erro ao tentar carregar os pontos de coleta. Tente novamente mais tarde.";
        statusMsg.style.display = 'block';
    }
}