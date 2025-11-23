// ============================================================
// 💙 VARAL DOS SONHOS — /js/componentes.js 
// ------------------------------------------------------------
// Carrega dinamicamente header, footer e cloudinho e
// atualiza login (saudação, logout) em todas as páginas.
// ============================================================

async function carregarComponente(id, arquivo) {
  try {
    const resp = await fetch(`/componentes/${arquivo}`);
    if (!resp.ok) throw new Error(`Erro ao carregar ${arquivo}`);

    const html = await resp.text();
    const el = document.getElementById(id);
    if (!el) return console.warn(`Elemento #${id} não encontrado.`);

    el.innerHTML = html;

    // ⬇️ Após carregar o HEADER
    if (id === "header") {
      setTimeout(() => {
        atualizarLogin();     
        aplicarConfigSite();  
      }, 200);
    }

  } catch (erro) {
    console.error("❌ Erro ao carregar componente:", erro);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponente("header", "header.html");
  await carregarComponente("footer", "footer.html");
  await carregarComponente("cloudinho", "cloudinho.html");

  // Segurança extra
  window.addEventListener("load", () => {
    atualizarLogin();
    aplicarConfigSite();
  });
});

// ============================================================
// 👤 Atualiza saudação, login/logout e visibilidade
// ============================================================
function atualizarLogin() {
  // 🔹 Padronização: usar somente "usuario"
  const usuarioData = localStorage.getItem("usuario");

  const loginLink = document.getElementById("loginLink");
  const usuarioNome = document.getElementById("usuarioNome");
  const btnLogout = document.getElementById("btnLogout");

  if (!loginLink || !usuarioNome || !btnLogout) return;

  // Usuário logado
  if (usuarioData) {
    const usuario = JSON.parse(usuarioData);

    const primeiroNome = usuario.nome?.split(" ")[0] || "Usuário";

    usuarioNome.textContent = `Olá, ${primeiroNome}! 💙`;
    usuarioNome.style.display = "inline-block";

    loginLink.style.display = "none";
    btnLogout.style.display = "inline-block";

    // LOGOUT
    btnLogout.onclick = () => {
      localStorage.removeItem("usuario");
      alert("💙 Você saiu com sucesso!");
      window.location.href = "/index.html";
    };

  } else {
    // Visitante
    usuarioNome.style.display = "none";
    loginLink.style.display = "inline-block";
    btnLogout.style.display = "none";
  }
}
