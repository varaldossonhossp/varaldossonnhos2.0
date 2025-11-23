// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js 
// ============================================================
// Script para a página de login:
// • Captura formulário de login
// • Envia requisição para /api/usuarios (login)
// • Trata resposta e grava sessão no localStorage
// • Redireciona para index.html
//
// Lógica:
// ✔ Captura evento submit do formulário
// ✔ Valida campos obrigatórios
// ✔ Envia requisição POST para /api/usuarios
// ✔ Trata resposta de sucesso ou erro
// ✔ Grava dados do usuário no localStorage
// ✔ Redireciona para a página inicial
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

    // ========================
    // 1️⃣ LOGIN DE USUÁRIO NORMAL
    // ========================
    const userResp = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "login",
        email_usuario: email,
        senha: senha,
      }),
    });

    const userData = await userResp.json().catch(() => null);

    if (userData && userData.sucesso && userData.usuario) {
      const u = userData.usuario;

      // ✔ Gravar usuário padronizado
      localStorage.setItem("usuario", JSON.stringify({
        id: u.id,
        nome: u.nome,           
        email: u.email,         
        telefone: u.telefone || "",
        endereco: u.endereco || "",
        numero: u.numero || "",
        cidade: u.cidade || "",
        cep: u.cep || "",
        tipo: u.tipo || "doador",
      }));

      // ⬇️ AQUI — ativar modal no index
      localStorage.setItem("mostrarModal", "sim");

      setTimeout(() => {
        window.location.href = "/index.html";
      }, 400);

      return;
    }

    // ========================
    // 2️⃣ LOGIN DO PONTO DE COLETA
    // ========================
    const pontoResp = await fetch("/api/pontosdecoleta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "login",
        email_ponto: email,
        senha: senha,
      }),
    });

    const pontoData = await pontoResp.json().catch(() => null);

    if (pontoData && pontoData.sucesso && pontoData.ponto) {
      const p = pontoData.ponto;

      localStorage.setItem("usuario", JSON.stringify({
        id: p.id_ponto,
        nome: p.nome_ponto,
        email: p.email_ponto,
        tipo: "ponto",
      }));

      // ⬇️ AQUI — ativar modal no index
      localStorage.setItem("mostrarModal", "sim");

      setTimeout(() => {
        window.location.href = "/index.html";
      }, 400);

      return;
    }

    // ========================
    // 3️⃣ ERRO FINAL
    // ========================
    alert("❌ E-mail ou senha incorretos.");
  });
});
