// ============================================================
// 📦 Pontos de Coleta — Varal dos Sonhos 2.0
// ------------------------------------------------------------
// Versão de testes locais com dados simulados (sem Airtable)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("listaColeta");

  try {
    // 🔹 Dados simulados (use /api/pontosdecoleta em produção)
    const dados = {
      sucesso: true,
      pontos: [
        { nome_ponto: "Ponto Central", endereco: "Av. Paulista, 1000 - Bela Vista, São Paulo", telefone: "(11) 99999-0000", horario: "Seg a Sex, 8h às 18h", responsavel: "ponto_coleta_central", status: "ativo" },
        { nome_ponto: "Ponto Norte", endereco: "R. Voluntários da Pátria, 95 - Santana, São Paulo", telefone: "(11) 98888-0000", horario: "Seg a Sáb, 9h às 17h", responsavel: "voluntario_ana", status: "ativo" },
        { nome_ponto: "ETEC de São Paulo - Luz", endereco: "Av. Tiradentes, 615 - Luz, São Paulo", telefone: "(11) 99000-0000", horario: "Seg a Sex, 8h às 18h", responsavel: "Laura", status: "ativo" }
      ]
    };

    // 🔹 Renderiza os cartões
    container.innerHTML = dados.pontos.map(p => `
      <div class="card-ponto">
        <h3>${p.nome_ponto}</h3>
        <p>${p.endereco}</p>
        <p>📞 ${p.telefone}</p>
        <p>🕐 ${p.horario}</p>
        <p><b>Responsável:</b> ${p.responsavel}</p>
        <button onclick="abrirMapa('${encodeURIComponent(p.endereco)}')">Ver no Mapa</button>
      </div>
    `).join("");

  } catch (erro) {
    console.error("Erro ao carregar pontos:", erro);
    container.innerHTML = `<p>❌ Não foi possível carregar os pontos de coleta.</p>`;
  }
});

// ============================================================
// 🗺️ Modal com Google Maps
// ============================================================
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
