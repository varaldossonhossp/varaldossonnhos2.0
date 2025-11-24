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

  window.addEventListener("load", () => {
    atualizarLogin();
    aplicarConfigSite();
  });
});

// ============================================================
// 👤 Atualiza saudação, links de painel e login/logout
// ============================================================

function atualizarLogin() {
  const raw = localStorage.getItem("usuario");
  const usuario = raw ? JSON.parse(raw) : null;

  // ELEMENTOS DO HEADER
  const saudacao = document.getElementById("saudacaoUsuario");
  const linkLogin = document.getElementById("linkLogin");
  const linkCadastro = document.getElementById("linkCadastro");
  const linkSair = document.getElementById("linkSair");
  const meuPainel = document.getElementById("meuPainelLink");

  const linkPainelAdmin = document.getElementById("linkPainelAdmin");
  const linkPainelPonto = document.getElementById("linkPainelPonto");
  const linkPainelDoador = document.getElementById("linkPainelDoador");

  if (!saudacao || !linkLogin || !linkCadastro || !linkSair) return;

  // === VISITANTE ===
  if (!usuario) {
    saudacao.style.display = "none";
    linkSair.style.display = "none";
    meuPainel.style.display = "none";

    linkLogin.style.display = "inline-block";
    linkCadastro.style.display = "inline-block";

    return;
  }

  // === USUÁRIO LOGADO ===
  const nome = usuario.nome || usuario.nome_usuario || "Usuário";
  const primeiroNome = nome.split(" ")[0];

  saudacao.textContent = `Olá, ${primeiroNome}! 💙`;
  saudacao.style.display = "inline-block";

  linkLogin.style.display = "none";
  linkCadastro.style.display = "none";
  linkSair.style.display = "inline-block";

  // Mostrar painel correto
  meuPainel.style.display = "inline-block";

  // TIPOS DE USUÁRIO
  if (usuario.tipo === "admin") {
    meuPainel.href = "/pages/admin.html";
    linkPainelAdmin.style.display = "inline-block";
  }
  else if (usuario.tipo === "ponto") {
    meuPainel.href = "/pages/painel-ponto.html";
    linkPainelPonto.style.display = "inline-block";
  }
  else {
    meuPainel.href = "/pages/painel-doador.html";
    linkPainelDoador.style.display = "inline-block";
  }

  // === LOGOUT ===
  linkSair.onclick = () => {
    localStorage.removeItem("usuario");
    alert("💙 Você saiu com sucesso!");
    window.location.href = "/index.html";
  };
}

