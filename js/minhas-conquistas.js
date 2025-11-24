// ============================================================
// 💙 VARAL DOS SONHOS — /js/minhas-conquistas.js
// ------------------------------------------------------------
// Página "Minhas Conquistas":
// • Lê o usuário logado do localStorage
// • Consulta /api/gamificacao_unificada?email_usuario=xxx
// • Backend já calcula total de adoções concluídas,
//   nível, título da conquista e pontos de coração
// • A API também devolve a lista de "regras" para montar
//   os cards de conquistas (níveis).
// ============================================================

// ------------------------------------------------------------
// Recupera usuário logado (mesma lógica das outras páginas)
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Formata data ISO → dd/mm/aaaa
// ------------------------------------------------------------
function formatarData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// ------------------------------------------------------------
// Renderiza o card de resumo da gamificação
// ------------------------------------------------------------
function renderResumo(container, gamificacao) {
  if (!gamificacao) {
    container.innerHTML = `
      <p class="text-gray-700">
        Você ainda não possui registro de gamificação.<br/>
        Adote sua primeira cartinha para desbloquear conquistas 💙
      </p>
    `;
    return;
  }

  const nivel = gamificacao.nivel_gamificacao_atual || "Iniciante";
  const pontos = gamificacao.pontos_coracao || 0;
  const total = gamificacao.total_adocoes || 0;
  const titulo =
    gamificacao.titulo_conquista_atual ||
    "💙 Coração Azul — cada ato seu espalha sonhos.";
  const data = gamificacao.data_ultima_atualizacao
    ? formatarData(gamificacao.data_ultima_atualizacao)
    : "—";

  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p class="text-sm text-gray-600 mb-1">Seu nível atual</p>
        <h2 class="text-2xl font-bold text-blue-800 flex items-center gap-2">
          ${titulo}
        </h2>
        <span class="tag-nivel mt-2 inline-block">
          Nível de gamificação: ${nivel}
        </span>
      </div>

      <div class="flex flex-wrap gap-6">
        <div>
          <p class="text-xs uppercase text-gray-500 tracking-wide">Pontos de coração</p>
          <p class="text-2xl font-semibold text-blue-700">${pontos}</p>
        </div>

        <div>
          <p class="text-xs uppercase text-gray-500 tracking-wide">Cartinhas concluídas</p>
          <p class="text-2xl font-semibold text-blue-700">${total}</p>
        </div>

        <div>
          <p class="text-xs uppercase text-gray-500 tracking-wide">Última atualização</p>
          <p class="text-sm text-gray-700">${data}</p>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// Renderiza lista de conquistas (regras que vem da API)
// ------------------------------------------------------------
function renderConquistas(container, regras, totalAdocoes) {
  if (!Array.isArray(regras) || regras.length === 0) {
    container.innerHTML = `
      <p class="text-gray-700">
        Nenhuma regra de gamificação cadastrada ainda.
      </p>
    `;
    return;
  }

  container.innerHTML = "";

  // Descobre a conquista atual e a próxima, com base na faixa_minima
  let indiceAtual = -1;
  regras.forEach((r, idx) => {
    if (totalAdocoes >= (r.faixa_minima || 0)) {
      indiceAtual = idx;
    }
  });
  const indiceProxima = indiceAtual + 1 < regras.length ? indiceAtual + 1 : -1;

  regras.forEach((regra, idx) => {
    const titulo = regra.titulo_conquista || "Conquista";
    const descricao = regra.descricao || "";
    const faixa = regra.faixa_minima || 0;
    const nivel = regra.nivel || "Iniciante";

    // Tenta extrair um emoji no começo do título
    const primeiraParte = titulo.split(" ")[0];
    const emojiRegExp = /[\u2190-\u2BFF\u2600-\u27BF\uD800-\uDBFF]/;
    const temEmoji = emojiRegExp.test(primeiraParte);
    const emoji = temEmoji ? primeiraParte : "🏅";
    const tituloSemEmoji = temEmoji
      ? titulo.replace(primeiraParte, "").trim()
      : titulo;

    let extraClasse = "";
    let selo = "";

    if (idx === indiceAtual && totalAdocoes > 0) {
      extraClasse = "badge-atual";
      selo = `<span class="selo">Conquista atual</span>`;
    } else if (idx === indiceProxima) {
      extraClasse = "badge-proxima";
      selo = `<span class="selo selo-proxima">Próxima conquista</span>`;
    }

    const badge = document.createElement("div");
    badge.className = "badge " + extraClasse;

    badge.innerHTML = `
      ${selo}
      <div class="emoji">${emoji}</div>
      <h3 class="font-bold text-blue-700 text-base mb-1">
        ${tituloSemEmoji}
      </h3>
      <p class="text-xs text-gray-600 mb-2">
        A partir de <strong>${faixa}</strong> adoção(ões) • Nível: <strong>${nivel}</strong>
      </p>
      <p class="text-sm text-gray-700">
        ${descricao}
      </p>
    `;

    container.appendChild(badge);
  });
}

// ------------------------------------------------------------
// Fluxo principal da página
// ------------------------------------------------------------
async function carregarConquistasGamificacao() {
  const usuario = obterUsuarioLogado();
  const resumoEl = document.getElementById("resumo-gamificacao");
  const listaEl = document.getElementById("listaConquistas");

  if (!resumoEl || !listaEl) {
    console.warn("Elementos de conteúdo não encontrados.");
    return;
  }

  if (!usuario) {
    resumoEl.innerHTML = `
      <p class="text-red-600">
        ⚠️ Faça login para visualizar suas conquistas.
      </p>
    `;
    listaEl.innerHTML = "";
    return;
  }

  // E-mail do usuário (igual usamos em outras páginas)
  const emailUsuario = (
    usuario.email_usuario ||
    usuario.email ||
    ""
  ).toLowerCase();

  if (!emailUsuario) {
    resumoEl.innerHTML = `
      <p class="text-red-600">
        Não foi possível identificar seu e-mail. Tente sair e entrar novamente.
      </p>
    `;
    listaEl.innerHTML = "";
    return;
  }

  try {
    resumoEl.innerHTML = `<p class="text-gray-600">Carregando suas conquistas...</p>`;
    listaEl.innerHTML = `<p class="text-gray-600">Carregando níveis de gamificação...</p>`;

    const url = `/api/gamificacao_unificada?email_usuario=${encodeURIComponent(
      emailUsuario
    )}`;

    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error("Erro ao chamar gamificacao_unificada");
    }

    const json = await resp.json();

    if (!json.sucesso) {
      throw new Error(json.mensagem || "Falha na gamificação.");
    }

    const gamificacao = json.gamificacao || null;
    const regras = json.regras || [];

    const totalAdocoes = gamificacao?.total_adocoes || 0;

    renderResumo(resumoEl, gamificacao);
    renderConquistas(listaEl, regras, totalAdocoes);
  } catch (erro) {
    console.error("Erro ao carregar conquistas:", erro);
    resumoEl.innerHTML = `
      <p class="text-red-600">
        Ocorreu um erro ao carregar suas conquistas. Tente novamente mais tarde.
      </p>
    `;
    listaEl.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", carregarConquistasGamificacao);
