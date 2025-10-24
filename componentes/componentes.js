// Carrega automaticamente header, footer e cloudinho em todas as páginas
async function carregarComponente(id, arquivo) {
  const destino = document.getElementById(id);
  if (!destino) return;
  const resp = await fetch(`/componentes/${arquivo}`);
  destino.innerHTML = await resp.text();
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponente("header", "header.html");
  await carregarComponente("footer", "footer.html");
  await carregarComponente("cloudinho", "cloudinho.html");

  // Gerencia menu dinâmico conforme login
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (usuario) {
    const nomeSpan = document.getElementById("user-name");
    const areaUser = document.getElementById("user-area");
    const btnLogout = document.getElementById("logout-btn");
    const loginLink = document.getElementById("login-link");
    const cadastroLink = document.getElementById("cadastro-link");
    const adminLink = document.getElementById("admin-link");
    const rankingLink = document.getElementById("ranking-link");

    nomeSpan.textContent = `Olá, ${usuario.nome}!`;
    areaUser.classList.remove("hidden");
    loginLink.classList.add("hidden");
    cadastroLink.classList.add("hidden");

    if (usuario.tipo === "administrador") adminLink.classList.remove("hidden");
    if (usuario.tipo === "doador") rankingLink.classList.remove("hidden");

    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuario");
      window.location.href = "/index.html";
    });
  }
});
