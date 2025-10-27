// ============================================================
// 📦 Pontos de Coleta — Varal dos Sonhos 2.0
// ------------------------------------------------------------
// Busca dados no Airtable e exibe cartões animados pendurados
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("listaColeta");

  try {
    const resp = await fetch("/api/pontosdecoleta");
    const dados = await resp.json();

    if (!dados?.sucesso) throw new Error("Erro ao carregar dados");

    container.innerHTML = dados.pontos
      .filter(p => p.status === "ativo")
      .map(p => `
        <div class="card-ponto">
          <h3>${p.nome_ponto}</h3>
          <p>${p.endereco}</p>
          <p>📞 ${p.telefone || "—"}</p>
          <p>🕐 ${p.horario}</p>
          <p><b>Responsável:</b> ${p.responsavel}</p>
          <button onclick="abrirMapa('${encodeURIComponent(p.endereco)}')">
            Ver no Mapa
          </button>
        </div>
      `)
      .join("");
  } catch (erro) {
    console.error("Erro ao carregar pontos:", erro);
    container.innerHTML = `<p>❌ Não foi possível carregar os pontos de coleta.</p>`;
  }
});

// ------------------------------------------------------------
// 🔗 Abre o Google Maps em um iframe modal
// ------------------------------------------------------------
function abrirMapa(endereco) {
  const url = `https://www.google.com/maps?q=${endereco}&output=embed`;
  const modal = document.createElement("div");
  modal.className = "modal-mapa";
  modal.innerHTML = `
    <div class="conteudo-mapa">
      <iframe src="${url}" loading="lazy"></iframe>
      <button class="fechar" onclick="this.parentElement.parentElement.remove()">✖</button>
    </div>
  `;
  document.body.appendChild(modal);
}
