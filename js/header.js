// ============================================================
// 💙 VARAL DOS SONHOS — /js/header.js
// ------------------------------------------------------------
// Exibe o nome do usuário logado, mostra/oculta menus
// conforme o tipo (administrador / doador / visitante).
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const header = document.getElementById("header");
  if (!header) {
    console.warn("⚠️ Elemento #header não encontrado na página.");
    return;
  }

  try {
    // ============================================================
    // 1️⃣ Carrega o HTML do cabeçalho dinâmico
    // ============================================================
    const resposta = await fetch("/componentes/header.html");
    if (!resposta.ok) throw new Error("Erro ao carregar header.html");
    const html = await resposta.text();
    header.innerHTML = html;

    // ============================================================
    // 2️⃣ Referências dos elementos
    // ============================================================
    const usuarioLogado = JSON.parse(localStorage.getItem("usuario_logado"));
    const loginLink = document.getElementById("linkLogin");
    const cadastroLink = document.getElementById("linkCadastro");
    const saudacao = document.getElementById("saudacaoUsuario");
    const sairLink = document.getElementById("linkSair");
    const painelAdmin = document.getElementById("linkPainelAdmin");
    const rankingLink = document.getElementById("linkRanking");

    // ============================================================
    // 3️⃣ Exibição condicional
    // ============================================================
    if (usuarioLogado && usuarioLogado.nome) {
      const nomeCurto = usuarioLogado.nome.split(" ")[0];
      saudacao.textContent = `👋 Olá, ${nomeCurto}!`;
      saudacao.style.display = "inline-block";
      loginLink.style.display = "none";
      cadastroLink.style.display = "none";
      sairLink.style.display = "inline-block";

      // Tipo do usuário
      if (usuarioLogado.tipo === "administrador") {
        painelAdmin.style.display = "inline-block";
      } else if (usuarioLogado.tipo === "doador") {
        rankingLink.style.display = "inline-block";
      }

      // ============================================================
      // 4️⃣ Função de logout
      // ============================================================
      sairLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Deseja encerrar sua sessão? 💭")) {
          localStorage.removeItem("usuario_logado");
          window.location.href = "/index.html";
        }
      });
    } else {
      // Visitante
      saudacao.style.display = "none";
      sairLink.style.display = "none";
      painelAdmin.style.display = "none";
      rankingLink.style.display = "none";
      loginLink.style.display = "inline-block";
      cadastroLink.style.display = "inline-block";
    }

  } catch (erro) {
    console.error("❌ Erro ao carregar o cabeçalho:", erro);
    header.innerHTML = `
      <header style="background:#4A90E2;color:white;text-align:center;padding:10px;">
        <h2>💙 Fantástica Fábrica de Sonhos</h2>
      </header>
    `;
  }
});
