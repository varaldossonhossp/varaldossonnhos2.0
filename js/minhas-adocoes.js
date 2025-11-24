// ============================================================
// 💙 VARAL DOS SONHOS — /js/minhas-adocoes.js  
// ------------------------------------------------------------
// • Filtra adoções pelo e-mail do usuário logado
// • Exibe barra animada + status com ícones
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

// ============================================================
// 🎨 Barra de progresso por status
// ============================================================
function calcularProgresso(status) {
  switch (status) {
    case "aguardando confirmacao": return { pct: 25, cor: "#64b5f6" };
    case "confirmada":             return { pct: 50, cor: "#42a5f5" };
    case "presente recebido":      return { pct: 75, cor: "#1e88e5" };
    case "presente entregue":      return { pct: 100, cor: "#0d47a1" };
    default:                       return { pct: 25, cor: "#90caf9" };
  }
}

// ============================================================
// 🔄 Ícone + texto do status
// ============================================================
function formatarStatus(status) {
  switch (status) {
    case "aguardando confirmacao": return { icone: "⏳", texto: "Aguardando confirmação" };
    case "confirmada":             return { icone: "📦", texto: "Confirmada — já pode enviar o presente" };
    case "presente recebido":      return { icone: "🚚", texto: "Presente recebido — nossa equipe irá coletar" };
    case "presente entregue":      return { icone: "🎁", texto: "Presente entregue — aguarde as fotos" };
    default:                       return { icone: "❓", texto: status };
  }
}

// ============================================================
// 📦 Carregar adoções do usuário
// ============================================================
async function carregarMinhasAdocoes() {
  const lista = document.getElementById("listaAdocoes");
  const usuario = obterUsuarioLogado();

  if (!usuario) {
    lista.innerHTML = `<p class="text-red-600">⚠️ Faça login para ver suas adoções.</p>`;
    return;
  }

  lista.innerHTML = `<p class="text-gray-600">Carregando suas adoções...</p>`;

  try {
    const resp = await fetch("/api/listAdocoes");
    const json = await resp.json();

    if (!json.sucesso) throw new Error("API não retornou sucesso");

    // Todas adoções
    const todas = json.adocoes;

    // 🟦 FILTRO CORRETO — a API retorna email_usuario
    const emailUser = (usuario.email_usuario || usuario.email || "").toLowerCase();

    const minhas = todas.filter(a =>
      (a.email_usuario || "").toLowerCase() === emailUser
    );

    // Nenhuma adoção
    if (!minhas.length) {
      lista.innerHTML = `<p class="text-gray-700">Você ainda não adotou nenhuma cartinha 💙</p>`;
      return;
    }

    // Renderiza tudo
    lista.innerHTML = "";

    minhas.forEach(a => {
      const statusInfo = formatarStatus(a.status_adocao);
      const prog = calcularProgresso(a.status_adocao);

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3 class="font-bold text-lg text-blue-700">Cartinha de ${a.nome_crianca}</h3>
        <p class="text-gray-700 text-sm">Sonho 🎁:  ${a.sonho}</p>

        <div class="mt-2 mb-2 flex flex-wrap gap-2">
          <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
          <span class="tag">📍 ${a.nome_ponto}</span>
        </div>

        <p class="mt-3 font-medium text-gray-800">
          ${statusInfo.icone} ${statusInfo.texto}
        </p>

        <!-- Barra de progresso -->
        <div class="w-full bg-blue-100 rounded-full h-3 mt-2 overflow-hidden">
          <div class="h-3 rounded-full progress-bar"
               style="width:0%; background:${prog.cor};
               transition: width 1.2s ease;"></div>
        </div>

        <p class="text-sm text-gray-600 mt-1">${prog.pct}%</p>
      `;

      lista.appendChild(card);

      // animação
      setTimeout(() =>
        card.querySelector(".progress-bar").style.width = `${prog.pct}%`,
      100);
    });

  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `<p class="text-red-600">Erro ao carregar adoções.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", carregarMinhasAdocoes);
