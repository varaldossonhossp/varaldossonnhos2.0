// ============================================================
// VARAL DOS SONHOS — Script: Pontos de Coleta
// ------------------------------------------------------------
// • Obtém os pontos de coleta via API (Airtable).
// • Exibe cards “pendurados” em um varal com prendedores.
// • Abre mapa interativo em modal centralizado.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarPontosDeColeta();
});

// 🔹 Busca e exibe os pontos de coleta
async function carregarPontosDeColeta() {
  const lista = document.getElementById("lista-pontos");
  const msg = document.getElementById("mensagem-status");

  lista.innerHTML = "<p class='placeholder'>Carregando pontos de coleta...</p>";
  msg.style.display = "none";

  try {
    const resp = await fetch("/api/pontosdecoleta");
    if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
    const dados = await resp.json();

    if (!dados.sucesso || !dados.pontos)
      throw new Error("Resposta inválida da API.");

    const ativos = dados.pontos.filter(p => p.status?.toLowerCase() === "ativo");

    if (ativos.length === 0) {
      lista.innerHTML = "<p class='placeholder erro'>Nenhum ponto ativo encontrado.</p>";
      return;
    }

    // Cria cards dinâmicos
    lista.innerHTML = ativos.map(p => `
      <div class="gancho">
        <img src="../imagens/prendedor.png" alt="Prendedor" class="prendedor" />
        <div class="card-coleta">
          <h3 class="card-titulo">${p.nome_ponto}</h3>
          <p><strong>📍 Endereço:</strong> ${p.endereco}</p>
          <p><strong>🕒 Horário:</strong> ${p.horario}</p>
          <p><strong>👤 Responsável:</strong> ${p.responsavel}</p>
          <p><strong>📞 Telefone:</strong> ${p.telefone}</p>
          <button class="btn-mapa" data-endereco="${p.endereco}, ${p.nome_ponto}">
            💙 Ver no mapa
          </button>
        </div>
      </div>
    `).join("");

    // Adiciona ação aos botões de mapa
    document.querySelectorAll(".btn-mapa").forEach(btn => {
      btn.addEventListener("click", e => abrirMapa(e.target.dataset.endereco));
    });

  } catch (err) {
    console.error("Erro ao carregar pontos:", err);
    lista.innerHTML = "<p class='placeholder erro'>Erro ao carregar pontos de coleta.</p>";
  }
}

// 🔹 Exibe mapa em modal centralizado
function abrirMapa(endereco) {
  let modal = document.querySelector("#mapModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mapModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content" role="dialog" aria-label="Mapa">
        <button id="closeModal" class="close" aria-label="Fechar mapa">×</button>
        <iframe id="mapFrame" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>`;
    document.body.appendChild(modal);

    // Fechamento por clique
    modal.querySelector(".close").addEventListener("click", fecharModal);
    modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
  }

  const iframe = modal.querySelector("#mapFrame");
  iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(endereco)}&z=15&output=embed`;
  modal.classList.add("aberto");
}

// 🔹 Fecha o modal
function fecharModal() {
  const modal = document.querySelector("#mapModal");
  if (modal) modal.classList.remove("aberto");
}
