// ============================================================
// 💙 VARAL DOS SONHOS — /js/header.js (VERSÃO FINAL)
// ------------------------------------------------------------
// Lógica:
// ✔ Sempre lê localStorage.usuario
// ✔ Exibe nome e botão sair
// ✔ Cria e controla o botão “MEU PAINEL”
// ✔ Oculta links antigos de painel
// ============================================================

function inicializarHeader() {
  const usuarioData = localStorage.getItem("usuario");
  const usuario = usuarioData ? JSON.parse(usuarioData) : null;

  const saudacao = document.getElementById("saudacaoUsuario");
  const linkLogin = document.getElementById("linkLogin");
  const linkCadastro = document.getElementById("linkCadastro");
  const linkSair = document.getElementById("linkSair");

  // Ocultar links antigos
  const painelAdmin = document.getElementById("linkPainelAdmin");
  const painelPonto = document.getElementById("linkPainelPonto");
  const painelDoador = document.getElementById("linkPainelDoador");

  if (painelAdmin) painelAdmin.style.display = "none";
  if (painelPonto) painelPonto.style.display = "none";
  if (painelDoador) painelDoador.style.display = "none";

  // Criar botão "MEU PAINEL"
  let botaoPainel = document.getElementById("meuPainelBtn");
  if (!botaoPainel) {
    botaoPainel = document.createElement("li");
    botaoPainel.id = "meuPainelBtn";
    botaoPainel.innerHTML = `
      <a id="meuPainelLink" style="display:none;">📂 Meu Painel</a>
    `;
    document.getElementById("menu-links").appendChild(botaoPainel);
  }

  const linkPainel = document.getElementById("meuPainelLink");

  // VISITANTE
  if (!usuario) {
    if (saudacao) saudacao.style.display = "none";
    if (linkSair) linkSair.style.display = "none";
    if (linkPainel) linkPainel.style.display = "none";

    linkLogin.style.display = "inline-block";
    linkCadastro.style.display = "inline-block";
    return;
  }

  // USUÁRIO LOGADO
  const primeiroNome = usuario.nome?.split(" ")[0] || "Usuário";

  saudacao.textContent = `👋 Olá, ${primeiroNome}!`;
  saudacao.style.display = "inline-block";

  linkLogin.style.display = "none";
  linkCadastro.style.display = "none";
  linkSair.style.display = "inline-block";

  // DEFINIR PAINEL CORRETO
  let hrefPainel = "/pages/painel-doador.html"; // padrão

  if (usuario.tipo === "administrador") hrefPainel = "/pages/admin.html";
  if (usuario.tipo === "ponto") hrefPainel = "/pages/painel-ponto.html";
  if (usuario.tipo === "voluntario") hrefPainel = "/pages/painel-voluntario.html";

  // Mostrar botão MEU PAINEL
  linkPainel.href = hrefPainel;
  linkPainel.style.display = "inline-block";

  // LOGOUT
  linkSair.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("usuario");
    alert("💙 Você saiu com sucesso!");
    window.location.href = "/index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(inicializarHeader, 200);
});
