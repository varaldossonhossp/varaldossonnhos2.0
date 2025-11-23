// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js
// ------------------------------------------------------------
// Login unificado para:
// • Usuários (doador, voluntário, admin)
// • Pontos de coleta
// ------------------------------------------------------------
// Garante compatibilidade com header.js (usa "usuario_logado")
// e cria nova chave "ponto_logado" quando for login de ponto.
// ------------------------------------------------------------
// Tenta login em /usuarios → se falhar → tenta /pontos_coleta
// ============================================================


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("⚠️ Preencha todos os campos!");
      return;
    }

    // ============================================================
    // 1️⃣ TENTAR LOGIN COMO USUÁRIO NORMAL / ADMIN
    // ============================================================
    const userResp = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "login",
        email_usuario: email,
        senha: senha,
      }),
    });

    const userData = await userResp.json();

    if (userData.sucesso && userData.usuario) {
      salvarSessao({
        id: userData.usuario.id,
        nome: userData.usuario.nome_usuario,
        email: userData.usuario.email_usuario,
        telefone: userData.usuario.telefone,
        endereco: userData.usuario.endereco,
        numero: userData.usuario.numero,
        bairro: userData.usuario.bairro,
        cidade: userData.usuario.cidade,
        cep: userData.usuario.cep,
        tipo: userData.usuario.tipo_usuario, // administrador / doador / voluntario
      });
      return;
    }

    // ============================================================
    // 2️⃣ SE NÃO FOR USUÁRIO → TENTA LOGIN DO PONTO
    // ============================================================
    const pontoResp = await fetch("/api/pontosdecoleta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "login",
        email_ponto: email,
        senha: senha,
      }),
    });

    const pontoData = await pontoResp.json();

    if (pontoData.sucesso && pontoData.ponto) {
      salvarSessao({
        id: pontoData.ponto.id_ponto,
        nome: pontoData.ponto.nome_ponto,
        email: pontoData.ponto.email_ponto,
        tipo: "ponto",
      });
      return;
    }

    // ============================================================
    // 3️⃣ ERRO FINAL
    // ============================================================
    alert("❌ E-mail ou senha incorretos.");
  });

  function salvarSessao(usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));

    const nomeCurto = usuario.nome.split(" ")[0];
    alert(`💙 Bem-vindo(a), ${nomeCurto}!`);

    setTimeout(() => {
      if (usuario.tipo === "administrador") {
        window.location.href = "/pages/admin.html";
      } else if (usuario.tipo === "ponto") {
        window.location.href = "/pages/painel-ponto.html";
      } else {
        window.location.href = "/index.html";
      }
    }, 400);
  }
});
