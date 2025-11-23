// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js 
// ============================================================
// Script para a página de login:
// • Captura formulário de login
// • Envia requisição para /api/usuarios (login)
// • Trata resposta e grava sessão no localStorage
// • Redireciona para index.html
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

      // Grava sessão padronizada
      localStorage.setItem("usuario", JSON.stringify({
        id: u.id,
        nome: u.nome_usuario,
        email: u.email_usuario,
        telefone: u.telefone || "",
        endereco: u.endereco || "",
        numero: u.numero || "",
        bairro: u.bairro || "",
        cidade: u.cidade || "",
        cep: u.cep || "",
        tipo: u.tipo_usuario || "doador",
      }));

      alert(`💙 Bem-vindo(a), ${u.nome_usuario.split(" ")[0]}!`);

      // ✔ TODOS VÃO PARA O INDEX
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

      alert(`📦 Bem-vindo(a), ${p.nome_ponto}!`);

      // ✔ TODOS VÃO PARA O INDEX
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
