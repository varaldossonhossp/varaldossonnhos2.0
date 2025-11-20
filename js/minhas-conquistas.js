// ============================================================
// 💙 VARAL DOS SONHOS — /js/minhas-conquistas.js
// ------------------------------------------------------------
// Página "Minhas Conquistas":
// • Consulta a API de gamificação já existente (/api/gamificacao)
// • SOMENTE LEITURA — não desbloqueia nada, não atualiza nada
// • Exibe um resumo do nível + conquistas (se a API retornar)
// ============================================================

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler usuário do localStorage:", e);
    return null;
  }
}

async function carregarConquistas() {
  const usuario = obterUsuarioLogado();
  const container = document.querySelector(".content");
  if (!container) {
    console.warn("Container .content não encontrado.");
    return;
  }

  if (!usuario) {
    container.insertAdjacentHTML(
      "beforeend",
      `<p class="mt-4 text-red-600">⚠️ Faça login para ver suas conquistas.</p>`
    );
    return;
  }

  // Opcional: criar um bloco para resumo dinâmico
  let resumo = document.getElementById("resumo-gamificacao");
  if (!resumo) {
    resumo = document.createElement("div");
    resumo.id = "resumo-gamificacao";
    resumo.className = "mt-6 mb-8 p-4 bg-white rounded-xl shadow";
    container.insertBefore(resumo, container.children[2] || null);
  }
  resumo.innerHTML = `<p class="text-gray-600">Carregando suas conquistas...</p>`;

  try {
    // Ajuste os parâmetros de acordo com a sua API de gamificação:
    const idUsuario = usuario.id_usuario || usuario.id;
    const resp = await fetch(`/api/gamificacao?id_usuario=${idUsuario}`);

    if (!resp.ok) throw new Error("Falha ao consultar a API de gamificação.");
    const json = await resp.json();

    if (!json.sucesso) throw new Error(json.mensagem || "Erro na gamificação.");

    const dados = json.gamificacao || json.dados || json; // flexível

    const nivel = dados.nivel_atual || dados.nivel || "—";
    const pontos = dados.pontos_totais || dados.pontos || 0;
    const proximo = dados.pontos_proximo_nivel || dados.proximo_nivel || null;

    resumo.innerHTML = `
      <p class="text-blue-700 font-semibold text-lg">
        🌟 Nível atual: <strong>${nivel}</strong>
      </p>
      <p class="text-gray-700 text-sm">
        Pontos acumulados: <strong>${pontos}</strong>
        ${proximo ? `&nbsp;| Próximo nível em ${proximo} pontos` : ""}
      </p>
    `;

    // Se a API retornar uma lista de conquistas, vamos montar dinamicamente
    const listaConquistas =
      dados.conquistas ||
      dados.lista_conquistas ||
      dados.ultimas_conquistas ||
      [];

    const grid = document.querySelector(".grid");
    if (!grid) return; // usa apenas as conquistas estáticas do HTML

    // Se a API tiver conquistas, sobrescreve as estáticas
    if (Array.isArray(listaConquistas) && listaConquistas.length > 0) {
      grid.innerHTML = "";

      listaConquistas.forEach(c => {
        const nome = c.nome || c.titulo || "Conquista";
        const desc = c.descricao || c.descr || "Conquista especial!";
        const emoji = c.emoji || "🏅";

        const badge = document.createElement("div");
        badge.className = "badge";

        badge.innerHTML = `
          <div class="emoji">${emoji}</div>
          <h3 class="font-bold text-blue-700 text-lg">${nome}</h3>
          <p class="text-sm text-gray-600">${desc}</p>
        `;

        grid.appendChild(badge);
      });
    }

  } catch (erro) {
    console.error(erro);
    resumo.innerHTML = `<p class="text-red-600">
      Erro ao carregar gamificação. Tente novamente mais tarde.
    </p>`;
  }
}

document.addEventListener("DOMContentLoaded", carregarConquistas);
