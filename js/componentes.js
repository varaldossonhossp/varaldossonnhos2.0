// ============================================================
// 💙 VARAL DOS SONHOS — /js/componentes.js (Versão Final TCC)
// ------------------------------------------------------------
// Função: carrega dinamicamente os componentes fixos
// (header, footer e cloudinho) e mantém o estado de login
// persistente entre as páginas.
// ============================================================

async function carregarComponente(id, arquivo) {
  try {
    const resp = await fetch(`/componentes/${arquivo}`);
    if (!resp.ok) throw new Error(`Erro ao carregar ${arquivo}`);

    const html = await resp.text();
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.innerHTML = html;

      // 👇 Atualiza o estado de login assim que o header é inserido
      if (id === "header") atualizarLogin();
    }
  } catch (erro) {
    console.error("❌ Erro ao carregar componente:", erro);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponente("header", "header.html");
  await carregarComponente("footer", "footer.html");
  await carregarComponente("cloudinho", "cloudinho.html");
});

// ============================================================
// 👤 Atualiza saudação e botão "Sair" no header
// ============================================================
function atualizarLogin() {
  const usuarioData =
    localStorage.getItem("usuario") || localStorage.getItem("usuario_logado");
  const loginLink = document.getElementById("loginLink");
  const usuarioNome = document.getElementById("usuarioNome");
  const btnLogout = document.getElementById("btnLogout");

  if (!loginLink || !usuarioNome || !btnLogout) return;

  if (usuarioData) {
    const usuario = JSON.parse(usuarioData);

    usuarioNome.textContent = `Olá, ${usuario.nome.split(" ")[0]}! 💙`;
    usuarioNome.style.display = "inline-block";
    loginLink.style.display = "none";
    btnLogout.style.display = "inline-block";

    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuario");
      localStorage.removeItem("usuario_logado");
      alert("💙 Você saiu com sucesso!");
      window.location.href = "../index.html";
    });
  } else {
    usuarioNome.style.display = "none";
    loginLink.style.display = "inline-block";
    btnLogout.style.display = "none";
  }
}
