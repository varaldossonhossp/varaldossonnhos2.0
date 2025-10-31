// ============================================================
// 🎮 VARAL DOS SONHOS — js/gamificacao.js (versão TCC)
// ------------------------------------------------------------
// Controla o sistema de gamificação do usuário.
// Exibe conquistas, pontos e progressão de nível.
// Integra com as APIs:
//   - /api/gamificacao.js           → dados individuais do usuário
//   - /api/regras_gamificacao.js    → regras gerais do sistema
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const painel = document.getElementById("painel-gamificacao");
  if (!painel) return;

  // Recupera o usuário logado (salvo no login)
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) {
    painel.innerHTML = "<p>⚠️ Faça login para acompanhar suas conquistas.</p>";
    return;
  }

  try {
    // ============================================================
    // 1️⃣ Consulta regras de gamificação (níveis e conquistas)
    // ============================================================
    const regrasResp = await fetch("/api/regras_gamificacao");
    const regrasJson = await regrasResp.json();
    const regras = regrasJson?.regras || [];

    // ============================================================
    // 2️⃣ Consulta progresso individual do usuário
    // ============================================================
    const gamResp = await fetch(`/api/gamificacao?id_usuario=${usuario.id_usuario}`);
    const gamJson = await gamResp.json();
    const gam = gamJson?.gamificacao;

    // Caso ainda não tenha registro
    if (!gam) {
      painel.innerHTML = `
        <div class="gamificacao-inicial">
          <h3>💙 Bem-vindo(a), ${usuario.nome_usuario}!</h3>
          <p>Você ainda não iniciou sua jornada solidária.<br>
          Adote uma cartinha e ganhe seu primeiro 💙 <b>Coração Azul!</b></p>
        </div>`;
      return;
    }

    // ============================================================
    // 3️⃣ Monta o painel de progresso e conquistas
    // ============================================================
    const conquistasHtml = regras
      .map((regra) => {
        const conquistado = gam.total_cartinhas_adotadas >= regra.faixa_adocoes_min;
        return `
          <div class="conquista ${conquistado ? "ativa" : ""}">
            <div class="icone">${regra.titulo_conquista}</div>
            <div class="detalhes">
              <strong>${regra.condicao}</strong><br>
              <small>${regra.descricao_rotulo_gerada}</small>
            </div>
          </div>`;
      })
      .join("");

    painel.innerHTML = `
      <div class="gamificacao-card">
        <h3>🌟 Sua Jornada Solidária</h3>
        <p><b>${usuario.nome_usuario}</b></p>

        <div class="status">
          <p>💖 <b>Pontos:</b> ${gam.pontos_coracao}</p>
          <p>📬 <b>Cartinhas Adotadas:</b> ${gam.total_cartinhas_adotadas}</p>
          <p>🏆 <b>Nível Atual:</b> ${gam.titulo_conquista || "Iniciante Solidário 💙"}</p>
          <small>Última atualização: ${new Date(gam.ultima_atualizacao).toLocaleDateString("pt-BR")}</small>
        </div>

        <hr>
        <div class="conquistas-lista">${conquistasHtml}</div>
      </div>`;
  } catch (e) {
    console.error("Erro na gamificação:", e);
    painel.innerHTML = `<p>Erro ao carregar gamificação. Tente novamente mais tarde.</p>`;
  }
});
