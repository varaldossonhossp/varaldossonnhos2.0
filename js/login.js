// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js (Versão compatível com header.js)
// ------------------------------------------------------------
// Faz login, salva sessão em "usuario_logado" e redireciona.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) return console.warn("⚠️ Formulário de login não encontrado.");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("⚠️ Preencha todos os campos!");
      return;
    }

    try {
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
        alert("❌ E-mail ou senha incorretos.");
        return;
      }

      // 💾 Salva sessão usando o mesmo nome de chave do header.js
      localStorage.setItem(
        "usuario_logado",
        JSON.stringify({
          id: dados.usuario.id,
          nome: dados.usuario.nome_usuario,
          email: dados.usuario.email_usuario,
          tipo: dados.usuario.tipo_usuario,
        })
      );

      // 💬 Boas-vindas
      const nome = dados.usuario.nome_usuario.split(" ")[0];
      alert(`💙 Bem-vindo(a), ${nome}!\nContinue espalhando sonhos! 🌟`);

      // ✅ Redireciona após garantir o salvamento
      setTimeout(() => {
        if (dados.usuario.tipo_usuario === "administrador") {
          window.location.href = "/pages/admin.html";
        } else {
          window.location.href = "/index.html";
        }
      }, 500);
    } catch (erro) {
      console.error("⚠️ Erro ao efetuar login:", erro);
      alert("⚠️ Falha ao conectar com o servidor. Tente novamente mais tarde.");
    }
  });
});
