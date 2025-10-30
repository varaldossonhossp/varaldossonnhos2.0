// ============================================================
// 💙 VARAL DOS SONHOS — /js/header.js (CORRIGIDO)
// ------------------------------------------------------------
// Função: Carregar o cabeçalho global em todas as páginas.
// Mostra opções diferentes conforme o login do usuário:
//   - Visitante → Login / Cadastro
//   - Doador → Ranking
//   - Administrador/Voluntário → Painel Admin
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const header = document.getElementById("header");
  if (!header) {
    console.warn("⚠️ Elemento #header não encontrado na página.");
    return;
  }

  try {
    // Assumindo que você usa uma função externa para carregar o HTML do header (como no seu login.html)
    // Se o seu header.html for carregado por outro script, remova este bloco de fetch:
    // const resposta = await fetch("/componentes/header.html");
    // if (!resposta.ok) throw new Error("Erro ao carregar header.html");
    // const html = await resposta.text();
    // header.innerHTML = html;
        
    // 1️⃣ VERIFICA AS CHAVES CORRETAS SALVAS PELO LOGIN.JS
    const idUsuario = localStorage.getItem("id_usuario_varal");
    const nomeUsuario = localStorage.getItem("nome_usuario_varal");
    const tipoUsuario = localStorage.getItem("tipo_usuario_varal");

    // Usuário logado se tiver o ID e o Nome
    const estaLogado = idUsuario && nomeUsuario;

    // 2️⃣ Referências aos elementos do menu
    const liLogin = document.getElementById("liLogin");
    const liCadastro = document.getElementById("liCadastro");
    const liSaudacao = document.getElementById("liSaudacaoUsuario");
    const saudacaoSpan = document.getElementById("saudacaoUsuario");
    const liSair = document.getElementById("liSair");
    const linkSair = document.getElementById("linkSair");
    const liPainelAdmin = document.getElementById("liPainelAdmin");
    const liRanking = document.getElementById("liRanking");


    if (estaLogado) {
      // A) USUÁRIO LOGADO
      const primeiroNome = nomeUsuario.split(" ")[0];
      saudacaoSpan.textContent = `Olá, ${primeiroNome}! 👋`;

      // Oculta login/cadastro e exibe saudação/sair
      if (liLogin) liLogin.style.display = "none";
      if (liCadastro) liCadastro.style.display = "none";
      if (liSaudacao) liSaudacao.style.display = "inline-block";
      if (liSair) liSair.style.display = "inline-block";

      // Mostra Painel Admin ou Ranking conforme o tipo
      if (tipoUsuario === "administrador" || tipoUsuario === "voluntario") {
        if (liPainelAdmin) liPainelAdmin.style.display = "inline-block";
      } else if (tipoUsuario === "doador") {
        if (liRanking) liRanking.style.display = "inline-block";
      }

      // 🔴 Função de sair (Logout)
      if (linkSair) {
        linkSair.addEventListener("click", (e) => {
          e.preventDefault();
          // Limpa todas as chaves
          localStorage.removeItem("id_usuario_varal");
          localStorage.removeItem("nome_usuario_varal");
          localStorage.removeItem("email_usuario_varal");
          localStorage.removeItem("tipo_usuario_varal");
          window.location.href = "/index.html";
        });
      }

    } else {
      // B) USUÁRIO DESLOGADO
      // Assegura que todos os links de usuário logado estão escondidos
      if (liSaudacao) liSaudacao.style.display = "none";
      if (liSair) liSair.style.display = "none";
      if (liPainelAdmin) liPainelAdmin.style.display = "none";
      if (liRanking) liRanking.style.display = "none";
      
      // Assegura que Login/Cadastro estão visíveis
      if (liLogin) liLogin.style.display = "inline-block";
      if (liCadastro) liCadastro.style.display = "inline-block";
    }

  } catch (erro) {
    console.error("❌ Erro ao inicializar o menu do cabeçalho:", erro);
  }
});