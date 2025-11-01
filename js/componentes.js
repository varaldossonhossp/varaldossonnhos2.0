// ============================================================
// 💙 VARAL DOS SONHOS — /js/componentes.js (Versão Final TCC)
// ------------------------------------------------------------
// Módulo responsável por carregar dinamicamente os
// componentes fixos da interface:
//   - Cabeçalho (header.html)
//   - Rodapé (footer.html)
//   - Mascote Cloudinho (cloudinho.html)
//
// Além do carregamento visual, este arquivo também é
// responsável por manter o estado de login do usuário
// (saudação e botão “Sair”) visível em todas as páginas.
// ============================================================

// ------------------------------------------------------------
// 🔧 Função: carregarComponente(id, arquivo)
// ------------------------------------------------------------
// Busca o conteúdo HTML do componente informado e insere
// dinamicamente no elemento com o ID correspondente.
// ------------------------------------------------------------
async function carregarComponente(id, arquivo) {
  try {
    const resp = await fetch(`/componentes/${arquivo}`);
    if (!resp.ok) throw new Error(`Erro ao carregar ${arquivo}`);

    const html = await resp.text();
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.innerHTML = html;
    } else {
      console.warn(`Elemento com id "${id}" não encontrado no DOM.`);
    }
  } catch (erro) {
    console.error("❌ Erro ao carregar componente:", erro);
  }
}

// ------------------------------------------------------------
// 🚀 Evento principal (DOMContentLoaded)
// ------------------------------------------------------------
// Executa o carregamento dos componentes assim que o
// documento é completamente carregado, garantindo
// compatibilidade com todas as páginas do site.
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponente("header", "header.html");
  await carregarComponente("footer", "footer.html");
  await carregarComponente("cloudinho", "cloudinho.html");

  // Após carregar o cabeçalho, aplica a verificação de login
  atualizarLogin();
});

// ============================================================
// 👤 Função: atualizarLogin()
// ------------------------------------------------------------
// Garante que o nome do usuário logado apareça no header,
// e que o botão “Sair” limpe o localStorage e volte à página inicial.
// Também mantém compatibilidade com versões anteriores.
// ============================================================
function atualizarLogin() {
  // Aceita tanto "usuario" quanto "usuario_logado"
  const usuarioData =
    localStorage.getItem("usuario") || localStorage.getItem("usuario_logado");

  const loginLink = document.getElementById("loginLink");
  const usuarioNome = document.getElementById("usuarioNome");
  const btnLogout = document.getElementById("btnLogout");

  if (!loginLink || !usuarioNome || !btnLogout) return;

  if (usuarioData) {
    const usuario = JSON.parse(usuarioData);

    // Exibe saudação personalizada
    usuarioNome.textContent = `Olá, ${usuario.nome.split(" ")[0]}! 💙`;
    usuarioNome.style.display = "inline-block";

    // Oculta o link de login e mostra o botão "Sair"
    loginLink.style.display = "none";
    btnLogout.style.display = "inline-block";

    // Ao clicar em “Sair”, remove o usuário e recarrega a página inicial
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuario");
      localStorage.removeItem("usuario_logado");
      alert("💙 Você saiu com sucesso!");
      window.location.href = "../index.html";
    });
  } else {
    // Quando não há sessão ativa
    usuarioNome.style.display = "none";
    loginLink.style.display = "inline-block";
    btnLogout.style.display = "none";
  }
}
