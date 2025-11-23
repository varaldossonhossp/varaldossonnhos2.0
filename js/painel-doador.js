// ============================================================
// 💙 VARAL DOS SONHOS — /js/painel-doador.js
// ------------------------------------------------------------
// • Garante que o doador esteja logado antes de acessar o painel
// • Futuro: pode exibir o nome do usuário na sidebar ou no topo
// ============================================================
function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    alert("Faça login para acessar o painel.");
    return;
  }
});
