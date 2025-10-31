// ============================================================
// 💙 VARAL DOS SONHOS — /js/pontosdecoleta.js (versão final fofinha)
// ------------------------------------------------------------
// Lista os pontos de coleta da tabela "pontos_coleta" do Airtable
// e exibe em cards com prendedor e corda animada
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarPontosDeColeta();
});

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

    const ativos = dados.pontos.filter(
      (p) => p.status?.toLowerCase() === "ativo"
    );

    if (ativos.length === 0) {
      lista.innerHTML =
        "<p class='placeholder erro'>Nenhum ponto ativo encontrado.</p>";
      return;
    }

    lista.innerHTML = ativos
      .map(
        (p) => `
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
      </div>`
      )
      .join("");

    document.querySelectorAll(".btn-mapa").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        abrirMapa(e.target.dataset.endereco)
      );
    });
  } catch (err) {
    console.error("Erro ao carregar pontos:", err);
    lista.innerHTML =
      "<p class='placeholder erro'>Erro ao carregar pontos de coleta.</p>";
  }
}

// 🔹 Modal do mapa
function abrirMapa(endereco) {
  let modal = document.querySelector(".modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close" aria-label="Fechar mapa">&times;</button>
        <iframe width="100%" height="450" style="border:0;" loading="lazy"
                referrerpolicy="no-referrer-when-downgrade" allowfullscreen
                src="https://maps.google.com/maps?q=${encodeURIComponent(
                  endereco
                )}&z=15&output=embed"></iframe>
      </div>`;
    document.body.appendChild(modal);
    modal
      .querySelector(".close")
      .addEventListener("click", () => modal.classList.remove("aberto"));
  }
  modal.classList.add("aberto");
}
