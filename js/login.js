// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js (Versão Final Corrigida TCC)
// ------------------------------------------------------------
// Fluxo:
//   1️⃣ Valida campos
//   2️⃣ Envia dados à API /api/usuarios (acao = "login")
//   3️⃣ Salva sessão no localStorage ("usuario")
//   4️⃣ Mostra mensagem de boas-vindas
//   5️⃣ Redireciona e mantém usuário logado no header
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) {
    console.error("❌ Formulário de login não encontrado!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("⚠️ Preencha todos os campos para continuar!");
      return;
    }

    try {
      // Envia para a API unificada /api/usuarios
      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "login",
          email_usuario: email,
          senha: senha,
        }),
      });

      const dados = await resp.json();
      if (!dados.sucesso || !dados.usuario) {
        alert("❌ E-mail ou senha incorretos. Verifique e tente novamente.");
        return;
      }

      // ============================================================
      // 💾 SALVA NO LOCALSTORAGE (padronizado como "usuario")
      // ============================================================
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          id: dados.usuario.id || "",
          nome: dados.usuario.nome_usuario || "",
          email: dados.usuario.email_usuario || "",
          tipo: dados.usuario.tipo_usuario || "doador",
        })
      );

      // 💬 Mensagem motivacional
      const nome = dados.usuario.nome_usuario.split(" ")[0];
      alert(
        `💙 Bem-vindo(a), ${nome}!\n\nSonhar é o primeiro passo para mudar o mundo. Ajudar alguém a sonhar é o segundo.🌟`
      );

      // ============================================================
      // ⏳ PEQUENO ATRASO ANTES DO REDIRECIONAMENTO
      // ------------------------------------------------------------
      // Garante que o navegador salve o localStorage antes de
      // trocar de página, evitando perda do estado de login.
      // ============================================================
      setTimeout(() => {
        if (dados.usuario.tipo_usuario === "administrador") {
          window.location.href = "../pages/admin.html";
        } else {
          window.location.href = "../index.html";
        }
      }, 500); // meio segundo basta
    } catch (err) {
      console.error("⚠️ Erro ao efetuar login:", err);
      alert("⚠️ Erro ao conectar com o servidor. Tente novamente mais tarde.");
    }
  });
});
