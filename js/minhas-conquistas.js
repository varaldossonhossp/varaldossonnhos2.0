// ============================================================
// 💙 VARAL DOS SONHOS — /js/minhas-conquistas.js
// ------------------------------------------------------------
// Agora usa a API unificada:
//    /api/gamificacao_unificada?email_usuario=xxxx
//
// • Busca gamificação pelo e-mail do usuário logado
// • Busca todas regras em UMA só requisição
// • Renderiza resumo de nível + conquistas
// ============================================================

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// Formatar datas
// ------------------------------------------------------------
function formatarData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("pt-BR");
}

// ------------------------------------------------------------
// Renderizar o card de resumo da gamificação
// ------------------------------------------------------------
function renderResumo(container, gamificacao) {
  if (!gamificacao) {
    container.innerHTML = `
      <p class="text-gray-700">
        Você ainda não possui registro de gamificação.<br/>
        Adote sua primeira cartinha e desbloqueie conquistas 💙
      </p>
    `;
    return;
  }

  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:justify-between gap-4">

      <div>
        <p class="text-sm text-gray-600 mb-1">Seu nível atual</p>
        <h2 class="text-2xl font-bold text-blue-800 flex items-center gap-2">
          ${gamificacao.titulo_conquista_atual || "—"}
        </h2>

        <span class="tag-nivel mt-2 inline-block">
          Nível de gamificação: ${gamificacao.nivel_gamificacao_atual || "Iniciante"}
        </span>
      </div>

      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs uppercase text-gray-500">Pontos de coração</p>
          <p class="text-2xl font-semibold text-blue-700">
            ${gamificacao.pontos_coracao}
          </p>
        </div>

        <div>
          <p class="text-xs uppercase text-gray-500">Cartinhas adotadas</p>
          <p class="text-2xl font-semibold text-blue-700">
            ${gamificacao.total_cartinhas_adotadas}
          </p>
        </div>

        <div>
          <p class="text-xs uppercase text-gray-500">Última atualização</p>
          <p class="text-sm text-gray-700">
            ${formatarData(gamificacao.data_ultima_atualizacao)}
          </p>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// Renderizar lista completa de conquistas
// ------------------------------------------------------------
function renderConquistas(container, regras, totalAdocoes) {
  if (!regras || regras.length === 0) {
    container.innerHTML = `
      <p class="text-gray-700">Nenhuma regra cadastrada.</p>
    `;
    return;
  }

  container.innerHTML = "";

  let indiceAtual = -1;
  regras.forEach((r, idx) => {
    if (totalAdocoes >= (r.faixa_minima || 0)) indiceAtual = idx;
  });

  const indiceProxima = indiceAtual + 1 < regras.length ? indiceAtual + 1 : -1;

  regras.forEach((regra, idx) => {
    const emoji = regra.titulo_conquista.trim().split(" ")[0];
    const restanteTitulo = regra.titulo_conquista.replace(emoji, "").trim();

    const badge = document.createElement("div");
    badge.className = "badge";

    let classeExtra = "";
    let selo = "";

    if (idx === indiceAtual && totalAdocoes > 0) {
      classeExtra = "badge-atual";
      selo = `<span class="selo">Conquista atual</span>`;
    } else if (idx === indiceProxima) {
      classeExtra = "badge-proxima";
      selo = `<span class="selo selo-proxima">Próxima conquista</span>`;
    }

    badge.classList.add(classeExtra);

    badge.innerHTML = `
      ${selo}
      <div class="emoji">${emoji}</div>

      <h3 class="font-bold text-blue-700 text-base mb-1">
        ${restanteTitulo}
      </h3>

      <p class="text-xs text-gray-600 mb-2">
        A partir de <strong>${regra.faixa_minima}</strong> adoções
        • Nível: <strong>${regra.nivel}</strong>
      </p>

      <p class="text-sm text-gray-700">${regra.descricao}</p>
    `;

    container.appendChild(badge);
  });
}

// ------------------------------------------------------------
// 🚀 Fluxo principal
// ------------------------------------------------------------
async function carregarConquistasGamificacao() {
  const usuario = obterUsuarioLogado();
  const resumoEl = document.getElementById("resumo-gamificacao");
  const listaEl = document.getElementById("listaConquistas");

  if (!usuario) {
    resumoEl.innerHTML = `<p class="text-red-600">⚠️ Faça login para ver suas conquistas.</p>`;
    return;
  }

  const emailUser = (usuario.email_usuario || usuario.email || "").toLowerCase();

  resumoEl.innerHTML = `<p class="text-gray-600">Carregando informações...</p>`;
  listaEl.innerHTML = `<p class="text-gray-600">Carregando regras...</p>`;

  try {
    const resp = await fetch(`/api/gamificacao_unificada?email_usuario=${encodeURIComponent(emailUser)}`);
    if (!resp.ok) throw new Error("Erro ao chamar gamificacao_unificada");

    const json = await resp.json();

    if (!json.sucesso) throw new Error("API retornou erro");

    const gamificacao = json.gamificacao;
    const regras = json.regras || [];

    renderResumo(resumoEl, gamificacao);
    renderConquistas(listaEl, regras, gamificacao?.total_cartinhas_adotadas || 0);

  } catch (erro) {
    console.error("Erro ao carregar conquistas:", erro);
    resumoEl.innerHTML = `<p class="text-red-600">Erro ao carregar informações.</p>`;
    listaEl.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", carregarConquistasGamificacao);
