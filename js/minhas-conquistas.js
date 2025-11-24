// ============================================================
// 💙 VARAL DOS SONHOS — /js/minhas-conquistas.js 
// ------------------------------------------------------------
// Agora a busca é feita pelo e-mail, conforme a API nova
// • Exibe resumo da gamificação do usuário
// • Exibe lista de conquistas (regras_gamificacao)
// • Destaca conquista atual e próxima conquista
// ============================================================

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// Formata YYYY-MM-DD → DD/MM/AAAA
// ------------------------------------------------------------
function formatarData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ------------------------------------------------------------
// RENDER — Resumo da gamificação
// ------------------------------------------------------------
function renderResumo(container, gamificacao) {
  if (!gamificacao) {
    container.innerHTML = `
      <p class="text-gray-700">
        Você ainda não possui registro de gamificação.<br/>
        Adote sua primeira cartinha para desbloquear conquistas 💙
      </p>`;
    return;
  }

  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      <div>
        <p class="text-sm text-gray-600 mb-1">Seu nível atual</p>
        <h2 class="text-2xl font-bold text-blue-800 flex items-center gap-2">
          ${gamificacao.titulo_conquista_atual}
        </h2>
        <span class="tag-nivel mt-2 inline-block">
          Nível de gamificação: ${gamificacao.nivel_gamificacao_atual}
        </span>
      </div>

      <div class="flex flex-wrap gap-6">

        <div>
          <p class="text-xs uppercase text-gray-500">Pontos de coração</p>
          <p class="text-2xl font-semibold text-blue-700">${gamificacao.pontos_coracao}</p>
        </div>

        <div>
          <p class="text-xs uppercase text-gray-500">Cartinhas adotadas</p>
          <p class="text-2xl font-semibold text-blue-700">${gamificacao.total_cartinhas_adotadas}</p>
        </div>

        <div>
          <p class="text-xs uppercase text-gray-500">Última atualização</p>
          <p class="text-sm text-gray-700">${formatarData(gamificacao.data_ultima_atualizacao)}</p>
        </div>

      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// RENDER — Lista de conquistas (regras_gamificacao)
// ------------------------------------------------------------
function renderConquistas(container, regras, totalAdocoes) {

  container.innerHTML = "";

  let indiceAtual = -1;
  regras.forEach((r, i) => {
    if (totalAdocoes >= (r.faixa_minima || 0)) indiceAtual = i;
  });

  const indiceProxima = indiceAtual + 1 < regras.length ? indiceAtual + 1 : -1;

  regras.forEach((regra, idx) => {

    const badge = document.createElement("div");
    badge.className = "badge";

    if (idx === indiceAtual) badge.classList.add("badge-atual");
    if (idx === indiceProxima) badge.classList.add("badge-proxima");

    badge.innerHTML = `
      ${idx === indiceAtual ? `<span class="selo">Conquista atual</span>` : ""}
      ${idx === indiceProxima ? `<span class="selo selo-proxima">Próxima conquista</span>` : ""}
      
      <div class="emoji">${regra.titulo_conquista.split(" ")[0]}</div>

      <h3 class="font-bold text-blue-700 text-base mb-1">
        ${regra.titulo_conquista.replace(regra.titulo_conquista.split(" ")[0], "").trim()}
      </h3>

      <p class="text-xs text-gray-600 mb-2">
        A partir de <strong>${regra.faixa_minima}</strong> adoções
      </p>

      <p class="text-sm text-gray-700">${regra.descricao}</p>
    `;

    container.appendChild(badge);
  });
}

// ------------------------------------------------------------
// FLUXO PRINCIPAL
// ------------------------------------------------------------
async function carregarConquistasGamificacao() {

  const usuario = obterUsuarioLogado();

  const email = usuario?.email_usuario || usuario?.email;

  const resumoEl = document.getElementById("resumo-gamificacao");
  const listaEl = document.getElementById("listaConquistas");

  if (!email) {
    resumoEl.innerHTML = `<p class="text-red-600">Faça login para continuar.</p>`;
    return;
  }

  resumoEl.innerHTML = `<p class="text-gray-600">Carregando...</p>`;
  listaEl.innerHTML = `<p class="text-gray-600">Carregando...</p>`;

  try {
    const [gamiResp, regrasResp] = await Promise.all([
      fetch(`/api/gamificacao?email_usuario=${encodeURIComponent(email)}`),
      fetch(`/api/regras_gamificacao`)
    ]);

    const jGami = await gamiResp.json();
    const jRegras = await regrasResp.json();

    renderResumo(resumoEl, jGami.gamificacao || null);
    renderConquistas(listaEl, jRegras.regras || [], jGami.gamificacao?.total_cartinhas_adotadas || 0);

  } catch (e) {
    console.error("Erro:", e);
    resumoEl.innerHTML = `<p class="text-red-600">Erro ao carregar conquistas.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", carregarConquistasGamificacao);
