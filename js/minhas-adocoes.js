// -----------------------------------------------------------
// 💙 VARAL DOS SONHOS — /js/minhas-adocoes.js 
// -----------------------------------------------------------
// Página Minhas Adoções:
// • Carrega adoções do usuário logado
// • Exibe cards com status e progresso
// -----------------------------------------------------------  
// Obtém dados do usuário logado no localStorage
// Configuração de status e progresso das adoções
// Carrega e exibe as adoções do usuário
// ============================================================

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const statusConfig = {
  "aguardando confirmacao": {
    texto: "Aguardando confirmação do administrador",
    icone: "⏳",
    progresso: 20
  },
  "confirmada": {
    texto: "Confirmada — agora você já pode enviar o presente",
    icone: "📦",
    progresso: 40
  },
  "presente recebido": {
    texto: "Presente recebido — nossa equipe irá coletar",
    icone: "🚚",
    progresso: 70
  },
  "presente entregue": {
    texto: "Presente entregue — aguarde as fotos do evento",
    icone: "🎁",
    progresso: 100
  }
};

async function carregarMinhasAdocoes() {
  const lista = document.getElementById("listaAdocoes");
  const usuario = obterUsuarioLogado();

  if (!usuario) {
    lista.innerHTML = `<p class="text-red-700">Faça login para ver suas adoções.</p>`;
    return;
  }

  lista.innerHTML = `<p class="text-gray-700">Carregando...</p>`;

  try {
    const resp = await fetch("/api/listAdocoes");
    const json = await resp.json();

    const todas = json.adocoes;
    const idUsuario = usuario.id;

    const minhas = todas.filter(a => String(a.id_usuario) === String(idUsuario));

    if (!minhas.length) {
      lista.innerHTML = `<p class="text-gray-700">Você ainda não adotou nenhuma cartinha.</p>`;
      return;
    }

    lista.innerHTML = "";

    minhas.forEach(a => {
      const cfg = statusConfig[a.status_adocao] || statusConfig["aguardando confirmacao"];

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3 class="font-bold text-lg text-blue-800">${a.nome_crianca}</h3>
        <p class="text-gray-700">🎁 ${a.sonho}</p>

        <div class="mt-2 mb-2 text-sm">
          <span>🆔 Cartinha: <b>${a.id_cartinha}</b></span> •
          <span>📍 ${a.nome_ponto}</span>
        </div>

        <p class="mt-2 text-gray-800 text-sm">
          ${cfg.icone} <b>${cfg.texto}</b>
        </p>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${cfg.progresso}%"></div>
        </div>

        <p class="text-xs text-gray-600 mt-1">${cfg.progresso}% concluído</p>
      `;

      lista.appendChild(card);
    });

  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p class="text-red-600">Erro ao carregar adoções.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", carregarMinhasAdocoes);
