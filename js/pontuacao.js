// ============================================================
// 💙 VARAL DOS SONHOS — /js/pontuacao.js
// ------------------------------------------------------------
// Página "Pontuação":
// • Consulta a API /api/gamificacao (já existente)
// • SOMENTE LEITURA — não altera nada
// • Atualiza nível, pontos e barra de progresso
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

async function carregarPontuacao() {
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    alert("⚠️ Faça login para ver sua pontuação.");
    return;
  }

  const elNivel = document.getElementById("nivel-label");
  const elBarra = document.getElementById("barra-progresso");
  const elTexto = document.getElementById("texto-progresso");

  if (!elNivel || !elBarra || !elTexto) {
    console.warn(
      "Elementos de pontuação não encontrados. Verifique os IDs: nivel-label, barra-progresso, texto-progresso."
    );
  }

  try {
    const idUsuario = usuario.id_usuario || usuario.id;
    const resp = await fetch(`/api/gamificacao?id_usuario=${idUsuario}`);
    if (!resp.ok) throw new Error("Falha ao consultar a API de gamificação.");

    const json = await resp.json();
    if (!json.sucesso) throw new Error(json.mensagem || "Erro na gamificação.");

    const dados = json.gamificacao || json.dados || json;

    const nivel = dados.nivel_atual || dados.nivel || "—";
    const pontos = Number(dados.pontos_totais || dados.pontos || 0);
    const meta = Number(dados.pontos_proximo_nivel || dados.meta || 1000);

    const perc = meta > 0 ? Math.min(100, Math.round((pontos / meta) * 100)) : 0;

    if (elNivel) {
      elNivel.textContent = `Nível ${nivel}`;
    }
    if (elBarra) {
      elBarra.style.width = perc + "%";
    }
    if (elTexto) {
      elTexto.textContent = `${pontos} / ${meta} pontos`;
    }

  } catch (erro) {
    console.error(erro);
    if (elTexto) {
      elTexto.textContent = "Erro ao carregar pontuação.";
    }
  }
}

document.addEventListener("DOMContentLoaded", carregarPontuacao);
