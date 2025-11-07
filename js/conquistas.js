// ============================================================
// 💙 VARAL DOS SONHOS — conquistas.js (versão sem Firebase)
// ------------------------------------------------------------
// Exibe informações da gamificação do usuário
// usando os dados vindos do Airtable via /api/gamificacao
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const statusMsg = document.getElementById("status-message");
  const dashboard = document.getElementById("dashboard-content");
  const nivelEl = document.getElementById("nivel-display");
  const badgeEl = document.getElementById("nivel-badge");
  const adocoesEl = document.getElementById("adocoes-display");
  const pontosEl = document.getElementById("pontos-display");
  const userIdEl = document.getElementById("user-id");

  // 👤 ID de exemplo (pode ser dinâmico no futuro)
  const id_usuario = "usuario_demo_001";
  userIdEl.textContent = id_usuario;

  try {
    // 🔹 Busca dados da API
    const resp = await fetch(`/api/gamificacao?id_usuario=${id_usuario}`);
    const json = await resp.json();

    if (!json.sucesso) throw new Error("Erro ao obter dados de gamificação");

    const data = json.gamificacao || {
      nivel_gamificacao_atual: "Iniciante",
      total_cartinhas_adotadas: 0,
      pontos_coracao: 0,
    };

    // 🎯 Atualiza os campos do painel
    updateDashboard(data);

    // ✅ Exibe painel
    statusMsg.classList.add("hidden");
    dashboard.classList.remove("hidden");
  } catch (err) {
    console.error("❌ Erro ao carregar dados da gamificação:", err);
    statusMsg.classList.remove("hidden");
    statusMsg.classList.add("bg-red-100", "border-red-500", "text-red-700");
    statusMsg.innerHTML = `<p class="font-bold">Erro</p><p>Não foi possível carregar as informações de gamificação.</p>`;
  }

  // ============================================================
  // 🎮 Função auxiliar para atualizar os elementos visuais
  // ============================================================
  function updateDashboard(data) {
    const nivel = data.nivel_gamificacao_atual || "Iniciante";
    const pontos = data.pontos_coracao || 0;
    const totalAdocoes = data.total_cartinhas_adotadas || 0;

    nivelEl.textContent = nivel;
    badgeEl.textContent = nivel;
    adocoesEl.textContent = totalAdocoes;
    pontosEl.textContent = pontos;

    // 🔸 Atualiza a cor do nível
    badgeEl.className = "level-badge mt-2"; // reset
    let levelClass = "";
    switch (nivel) {
      case "Intermediário":
        levelClass = "level-Intermediário";
        break;
      case "Avançado":
        levelClass = "level-Avançado";
        break;
      case "Lendário":
        levelClass = "level-Lendário";
        break;
      case "Iniciante":
      default:
        levelClass = "level-Iniciante";
        break;
    }
    badgeEl.classList.add(levelClass);
  }
});

// ============================================================
// 🎯 Busca e exibe as regras de gamificação
// ============================================================
async function carregarRegras() {
  try {
    const resp = await fetch("/api/regras_gamificacao");
    const json = await resp.json();

    if (!json.sucesso || !Array.isArray(json.regras)) return;

    const lista = document.getElementById("lista-regras");
    const container = document.getElementById("regras-container");
    lista.innerHTML = "";

    json.regras.forEach((regra) => {
      const item = document.createElement("div");
      item.className =
        "bg-white border-l-4 border-indigo-400 p-4 rounded-lg shadow-sm hover:shadow-md transition";
      item.innerHTML = `
        <p class="font-semibold text-indigo-600">${regra.nivel}</p>
        <p class="text-gray-800">${regra.titulo_conquista}</p>
        <p class="text-sm text-gray-500">🏆 A partir de ${regra.faixa_minima} adoções</p>
        <p class="text-xs text-gray-400 mt-1">${regra.descricao}</p>
      `;
      lista.appendChild(item);
    });

    container.classList.remove("hidden");
  } catch (err) {
    console.error("Erro ao carregar regras de gamificação:", err);
  }
}
carregarRegras();
// ============================================================
// Fim do arquivo conquistas.js
// ============================================================
