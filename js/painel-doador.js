// ============================================================
// 💙 VARAL DOS SONHOS — /js/painel-doador.js
// ------------------------------------------------------------
// • Garante que o doador esteja logado antes de acessar o painel
// • Futuro: pode exibir o nome do usuário na sidebar ou no topo
// ============================================================

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler usuário do localStorage:", e);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const usuario = obterUsuarioLogado();

  if (!usuario) {
    alert("⚠️ Faça login para acessar o painel do doador.");
    // Se tiver uma página específica de login, ajuste aqui:
    // window.location.href = "../login.html";
    return;
  }

  console.log("Usuário logado no painel doador:", usuario);

  // Exemplo: se quiser exibir o nome em algum lugar:
  const elNome = document.getElementById("nome-doador");
  if (elNome) {
    elNome.textContent = usuario.nome || "Doador";
  }
});
