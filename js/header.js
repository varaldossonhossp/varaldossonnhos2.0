// ============================================================
// 💙 VARAL DOS SONHOS — /js/header.js (Versão compatível modular)
// ------------------------------------------------------------
// Lê o login salvo e atualiza o menu do header dinamicamente.
// ============================================================

async function inicializarHeader() {
  // Espera o header carregar no DOM
  const headerDiv = document.getElementById("header");
  if (!headerDiv || !headerDiv.innerHTML.trim()) {
    setTimeout(inicializarHeader, 150);
    return;
  }

  // Espera o HTML ser realmente injetado
  const saudacao = document.getElementById("saudacaoUsuario");
  const linkLogin = document.getElementById("linkLogin");
  const linkCadastro = document.getElementById("linkCadastro");
  const linkSair = document.getElementById("linkSair");
  const linkPainelAdmin = document.getElementById("linkPainelAdmin");
  const linkConquista = document.getElementById("linkConquista");

  if (!saudacao) return;

  const usuario = JSON.parse(localStorage.getItem("usuario_logado"));

  if (usuario && usuario.nome) {
    const nomeCurto = usuario.nome.split(" ")[0];
    saudacao.textContent = `👋 Olá, ${nomeCurto}!`;
    saudacao.style.display = "inline-block";
    linkLogin.style.display = "none";
    linkCadastro.style.display = "none";
    linkSair.style.display = "inline-block";

    // Exibe menus conforme tipo
    if (usuario.tipo === "administrador") {
      linkPainelAdmin.style.display = "inline-block";
    } else {
      linkConquista.style.display = "inline-block";
    }

    // Logout
    linkSair.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("usuario_logado");
      alert("💙 Sessão encerrada com sucesso!");
      window.location.href = "/index.html";
    });
  } else {
    // Visitante
    saudacao.style.display = "none";
    linkSair.style.display = "none";
    linkPainelAdmin.style.display = "none";
    linkConquista.style.display = "none";
    linkLogin.style.display = "inline-block";
    linkCadastro.style.display = "inline-block";
  }
}

// Executa após o carregamento total da página
document.addEventListener("DOMContentLoaded", () => {
  inicializarHeader();
});
