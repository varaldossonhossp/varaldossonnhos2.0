// ============================================================
// 💙 VARAL DOS SONHOS — /js/componentes.js 
// ------------------------------------------------------------
// Carrega dinamicamente header, footer e cloudinho e
// garante que o nome do usuário logado e a configuração do site
// (logo, nuvem, etc.) sejam aplicados em todas as páginas.
// ============================================================

async function carregarComponente(id, arquivo) {
  try {
    const resp = await fetch(`/componentes/${arquivo}`);
    if (!resp.ok) throw new Error(`Erro ao carregar ${arquivo}`);

    const html = await resp.text();
    const el = document.getElementById(id);
    if (!el) return console.warn(`Elemento #${id} não encontrado.`);

    el.innerHTML = html;

    // ⬇️ AQUI — depois que o HEADER CARREGAR
    if (id === "header") {
      setTimeout(() => {
        atualizarLogin();     // já existia
        aplicarConfigSite();  // ⬅️ ESTA É A LINHA NOVA
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
    aplicarConfigSite(); // aplica a configuração se precisar
  });
});

// ============================================================
// 👤 Atualiza a saudação e o botão "Sair"
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

    btnLogout.onclick = () => {
      localStorage.removeItem("usuario");
      localStorage.removeItem("usuario_logado");
      alert("💙 Você saiu com sucesso!");
      window.location.href = "/index.html";
    };
  } else {
    usuarioNome.style.display = "none";
    loginLink.style.display = "inline-block";
    btnLogout.style.display = "none";
  }
}
