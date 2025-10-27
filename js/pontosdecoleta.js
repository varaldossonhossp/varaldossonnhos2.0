// ============================================================
// 📦 Pontos de Coleta — Varal dos Sonhos 2.0
// ------------------------------------------------------------
// Busca dados no Airtable e exibe cartões pendurados no varal
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("listaColeta");

  try {
    const resp = await fetch("/api/pontosdecoleta");
    if (!resp.ok) throw new Error("API não encontrada");
    const dados = await resp.json();

    if (!dados?.sucesso || !Array.isArray(dados.pontos))
      throw new Error("Resposta inválida da API");

    const ativos = dados.pontos.filter(p =>
      String(p.status).toLowerCase() === "ativo"
    );

    if (ativos.length === 0) {
      container.innerHTML = `<p class="msg-vazio">💭 Nenhum ponto de coleta ativo no momento.</p>`;
      return;
    }

    container.innerHTML = ativos
      .map(p => `
        <div class="card-ponto" onclick="abrirMapa('${encodeURIComponent(p.endereco)}')">
          <div class="prendedor"></div>
          <h3>${p.nome_ponto}</h3>
          <p>${p.endereco}</p>
          <p>📞 ${p.telefone || "—"}</p>
          <p>🕐 ${p.horario || ""}</p>
          <p><b>Responsável:</b> ${p.responsavel || ""}</p>
          <button>Ver no Mapa</button>
        </div>
      `)
      .join("");
  } catch (erro) {
    console.error("Erro ao carregar pontos:", erro);
    container.innerHTML = `<p>❌ Erro ao carregar pontos de coleta.</p>`;
  }
});

// ============================================================
// 🗺️ Modal Google Maps
// ============================================================
window.abrirMapa = (endereco) => {
  const url = `https://www.google.com/maps?q=${endereco}&output=embed`;
  document.getElementById("mapFrame").src = url;
  document.getElementById("mapModal").style.display = "flex";
};

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("mapModal").style.display = "none";
  document.getElementById("mapFrame").src = "";
});
