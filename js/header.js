// ============================================================
// 💙 VARAL DOS SONHOS — /js/header.js (FINAL)
// ------------------------------------------------------------
// Script do cabeçalho (header) do site:
// • Gerencia exibição de links conforme tipo de usuário logado
// • Suporta usuários: visitante, doador, voluntário, admin, ponto de coleta
// ============================================================

function inicializarHeader() {
  const usuario = JSON.parse(localStorage.getItem("usuario_logado"));

  const saudacao = document.getElementById("saudacaoUsuario");
  const linkLogin = document.getElementById("linkLogin");
  const linkCadastro = document.getElementById("linkCadastro");
  const linkSair = document.getElementById("linkSair");

  const linkPainelAdmin = document.getElementById("linkPainelAdmin");
  const linkPainelPonto = document.getElementById("linkPainelPonto");
  const linkConquista = document.getElementById("linkConquista");

  const toggle = document.getElementById("menu-toggle");
  const links = document.getElementById("menu-links");

  // botão mobile
  if (toggle) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("menu-aberto");
    });
  }

  // Visitante
  if (!usuario) {
    if (saudacao) saudacao.style.display = "none";
    linkSair.style.display = "none";
    linkPainelAdmin.style.display = "none";
    linkPainelPonto.style.display = "none";
    linkConquista.style.display = "none";

    linkLogin.style.display = "inline-block";
    linkCadastro.style.display = "inline-block";
    return;
  }

  // Usuário logado
  saudacao.textContent = `👋 Olá, ${usuario.nome.split(" ")[0]}!`;
  saudacao.style.display = "inline-block";
  linkLogin.style.display = "none";
  linkCadastro.style.display = "none";
  linkSair.style.display = "inline-block";

  // ADMIN
  if (usuario.tipo === "administrador") {
    linkPainelAdmin.style.display = "inline-block";
    linkPainelPonto.style.display = "none";
    linkConquista.style.display = "none";
  }

  // PONTO DE COLETA
  else if (usuario.tipo === "ponto") {
    linkPainelPonto.style.display = "inline-block";
    linkPainelAdmin.style.display = "none";
    linkConquista.style.display = "none";
  }

  // DOADOR / VOLUNTÁRIO
  else {
    linkConquista.style.display = "inline-block";
    linkPainelAdmin.style.display = "none";
    linkPainelPonto.style.display = "none";
  }

  // Logout
  linkSair.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("usuario_logado");
    window.location.href = "/index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(inicializarHeader, 150);
});
