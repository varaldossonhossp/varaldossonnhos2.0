// ============================================================
// 📦 Pontos de Coleta — Varal dos Sonhos 2.0
// ------------------------------------------------------------
// Busca dados no Airtable e exibe cartões “pendurados”
// com prendedor + balanço ao passar o mouse.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("listaColeta");

  try {
    const resp = await fetch("/api/pontosdecoleta", { cache: "no-store" });
    const dados = await resp.json();

    if (!dados?.sucesso || !Array.isArray(dados.pontos)) {
      throw new Error("Resposta inválida da API");
    }

    // Monta os cards (só ativos; aceitando 'ativo'/'Ativo'/true)
    const ativos = dados.pontos.filter((p) => {
      if (typeof p.status === "string") return p.status.toLowerCase() === "ativo";
      if (typeof p.status === "boolean") return p.status;
      return true; // se campo não existir, não bloqueia
    });

    if (ativos.length === 0) {
      container.innerHTML = `<p class="msg-vazio">Ainda não temos pontos de coleta ativos 💙</p>`;
      return;
    }

    container.innerHTML = ativos
      .map((p) => {
        const nome = p.nome_ponto ?? "Ponto de Coleta";
        const endereco = p.endereco ?? "Endereço não informado";
        const telefone = p.telefone ?? "—";
        const horario = p.horario ?? "—";
        const responsavel = p.responsavel ?? "Equipe Parceira";

        return `
          <article class="card-ponto" tabindex="0">
            <div class="prendedor" aria-hidden="true"></div>
            <h3>${nome}</h3>
            <p class="endereco">📍 ${endereco}</p>
            <p>📞 ${telefone}</p>
            <p>🕐 ${horario}</p>
            <p><strong>Responsável:</strong> ${responsavel}</p>
            <button class="btn-mapa"
              onclick="abrirMapa('${encodeURIComponent(endereco)}')"
              aria-label="Abrir mapa do endereço ${endereco}">
              Ver no Mapa
            </button>
          </article>
        `;
      })
      .join("");
  } catch (erro) {
    console.error("Erro ao carregar pontos de coleta:", erro);
    container.innerHTML = `<p class="msg-erro">❌ Não foi possível carregar os pontos de coleta agora.</p>`;
  }
});

// ------------------------------------------------------------
// 🔗 Abre o Google Maps em um modal (iframe)
// ------------------------------------------------------------
window.abrirMapa = function (endereco) {
  const url = `https://www.google.com/maps?q=${endereco}&output=embed`;

  const sombra = document.createElement("div");
  sombra.className = "modal-mapa";
  sombra.innerHTML = `
    <div class="conteudo-mapa" role="dialog" aria-modal="true" aria-label="Mapa do ponto de coleta">
      <button class="fechar" title="Fechar" aria-label="Fechar" onclick="this.closest('.modal-mapa').remove()">✖</button>
      <iframe src="${url}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  `;
  document.body.appendChild(sombra);
};
