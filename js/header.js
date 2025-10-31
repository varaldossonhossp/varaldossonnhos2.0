// ============================================================
// 💙 VARAL DOS SONHOS — header.js
// ------------------------------------------------------------
// Mostra menus de Login/Cadastro ou Olá [Nome] + Sair
// e adiciona “Painel Admin” ou “Ranking dos Sonhadores”
// conforme o campo usuarios.tipo no Airtable.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu-links");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  // Se estiver logado
  if (usuario && usuario.nome) {
    document.getElementById("link-login").remove();
    document.getElementById("link-cadastro").remove();

    const saudacao = document.createElement("li");
    saudacao.innerHTML = `👋 Olá, <strong>${usuario.nome}</strong>`;

    const sair = document.createElement("li");
    sair.innerHTML = `<a href="#" id="btn-sair">🚪 Sair</a>`;

    menu.appendChild(saudacao);

    // Mostra link adicional conforme o tipo de usuário
    if (usuario.tipo === "admin") {
      const admin = document.createElement("li");
      admin.innerHTML = `<a href="/pages/PainelAdmin.html">⚙️ Painel Admin</a>`;
      menu.appendChild(admin);
    }

    if (usuario.tipo === "doador") {
      const ranking = document.createElement("li");
      ranking.innerHTML = `<a href="/pages/Ranking.html">🏅 Ranking dos Sonhadores</a>`;
      menu.appendChild(ranking);
    }

    menu.appendChild(sair);

    // Ação de logout
    document.getElementById("btn-sair").addEventListener("click", () => {
      localStorage.removeItem("usuario");
      window.location.href = "../index.html";
    });
  }
});
// ============================================================
// 💙 VARAL DOS SONHOS — /js/header.js
// ------------------------------------------------------------
// Função: Carregar o cabeçalho global em todas as páginas.
// Mostra opções diferentes conforme o login do usuário:
//   - Visitante → Login / Cadastro
//   - Doador → Ranking dos Sonhadores
//   - Administrador → Painel Admin
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const header = document.getElementById("header");
  if (!header) {
    console.warn("⚠️ Elemento #header não encontrado na página.");
    return;
  }

  try {
    // ============================================================
    // 1️⃣ Carrega o HTML base do cabeçalho
    // ============================================================
    const resposta = await fetch("/componentes/header.html");
    if (!resposta.ok) throw new Error("Erro ao carregar header.html");
    const html = await resposta.text();
    header.innerHTML = html;

    // ============================================================
    // 2️⃣ Verifica se há usuário logado no localStorage
    // ============================================================
    const usuarioLogado = JSON.parse(localStorage.getItem("usuario"));

    const loginLink = document.getElementById("linkLogin");
    const cadastroLink = document.getElementById("linkCadastro");
    const saudacao = document.getElementById("saudacaoUsuario");
    const sairLink = document.getElementById("linkSair");
    const painelAdmin = document.getElementById("linkPainelAdmin");
    const rankingLink = document.getElementById("linkRanking");

    if (usuarioLogado && usuarioLogado.nome) {
      // Usuário logado
      const nomeCurto = usuarioLogado.nome.split(" ")[0];
      saudacao.textContent = `Olá, ${nomeCurto}! 👋`;
      saudacao.style.display = "inline-block";

      // Oculta login/cadastro e exibe sair
      loginLink.style.display = "none";
      cadastroLink.style.display = "none";
      sairLink.style.display = "inline-block";

      // Mostra Painel Admin ou Ranking conforme o tipo
      if (usuarioLogado.tipo === "administrador") {
        painelAdmin.style.display = "inline-block";
      } else if (usuarioLogado.tipo === "doador") {
        rankingLink.style.display = "inline-block";
      }

      // ============================================================
      // 🔴 Função de sair
      // ============================================================
      sairLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("usuario");
        window.location.href = "../index.html";
      });

    } else {
      // Visitante (não logado)
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
