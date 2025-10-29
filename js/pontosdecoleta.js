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
    listaPontos.innerHTML = "<p style='text-align:center;'>Buscando pontos de coleta no servidor...</p>";
    statusMsg.style.display = 'none';

   try {
        // O caminho deve ser ABSOLUTO (ou relativo à raiz, começando com /) para APIs no Vercel.
        const resposta = await fetch("/api/pontosdecoleta");
        
        if (!resposta.ok) {
            // Se o status HTTP não for 200, lançamos um erro. 
            // Isso deve capturar o 404 ou 500 que você está vendo.
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
            const enderecoFormatado = encodeURIComponent(ponto.endereco);
            // Link que abre no Google Maps.
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

    } catch (erro) {
        console.error("Falha detalhada ao carregar pontos de coleta:", erro);
        listaPontos.innerHTML = "";
        statusMsg.textContent = `⚠️ Houve um erro ao tentar carregar os pontos de coleta. Detalhe: ${erro.message}`;
        statusMsg.style.display = 'block';
    }
}