// ============================================================
// 💙 VARAL DOS SONHOS — /js/minhas-adocoes.js
// ------------------------------------------------------------
// Página "Minhas Adoções":
// • Carrega todas as adoções da API existente (/api/listAdocoes)
// • Filtra apenas as adoções do usuário logado (id_usuario)
// • Exibe em cards SOMENTE LEITURA (sem alterar status)
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

async function carregarMinhasAdocoes() {
  const lista = document.getElementById("listaAdocoes");
  if (!lista) {
    console.warn("Elemento #listaAdocoes não encontrado.");
    return;
  }

  const usuario = obterUsuarioLogado();
  if (!usuario) {
    lista.innerHTML = `<p class="text-red-600">⚠️ Faça login para ver suas adoções.</p>`;
    return;
  }

  lista.innerHTML = `<p class="text-gray-600">Carregando suas adoções...</p>`;

  try {
    const resp = await fetch("/api/listAdocoes");
    if (!resp.ok) throw new Error("Falha ao consultar a API de adoções.");

    const json = await resp.json();
    if (!json.sucesso || !Array.isArray(json.adocoes)) {
      throw new Error("Resposta inesperada da API de adoções.");
    }

    // Filtra as adoções do usuário logado
    const todas = json.adocoes;
    const idUsuario = String(usuario.id_usuario || usuario.id || "");
    const emailUsuario = (usuario.email || "").toLowerCase();

    const minhasAdocoes = todas.filter(a => {
      // Tenta casar por id_usuario (preferencial)
      if (a.id_usuario && String(a.id_usuario) === idUsuario) return true;

      // Opcional: fallback por email se a API retornar esse campo
      if (a.email_usuario && String(a.email_usuario).toLowerCase() === emailUsuario) {
        return true;
      }

      return false;
    });

    if (!minhasAdocoes.length) {
      lista.innerHTML = `<p class="text-gray-700">
        Você ainda não possui adoções registradas no sistema. 💙
      </p>`;
      return;
    }

    lista.innerHTML = "";

    minhasAdocoes.forEach(a => {
      const nomeCrianca = a.nome_crianca || "Criança";
      const sonho = a.sonho || "Sonho não informado";
      const idCartinha = a.id_cartinha || "—";
      const ponto = a.nome_ponto || "Ponto não informado";
      const status = a.status_adocao || "Não informado";

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3 class="font-bold text-lg text-blue-700">${nomeCrianca}</h3>
        <p class="text-gray-700 text-sm">🎁 ${sonho}</p>

        <div class="mt-2 mb-2">
          <span class="tag">🆔 Cartinha: ${idCartinha}</span>
          <span class="tag">📍 Ponto: ${ponto}</span>
          <span class="tag">📅 Status: ${status}</span>
        </div>
      `;

      lista.appendChild(card);
    });

  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `<p class="text-red-600">
      Erro ao carregar adoções. Tente novamente mais tarde.
    </p>`;
  }
}

document.addEventListener("DOMContentLoaded", carregarMinhasAdocoes);
