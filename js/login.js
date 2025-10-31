// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js
// ------------------------------------------------------------
// Função: autenticar o usuário com base nos dados do Airtable
// e salvar a sessão local (localStorage) para uso global.
// Após login bem-sucedido, mostra mensagem motivacional
// e redireciona o doador à página principal.
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
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_usuario: email, senha }),
      });

      const dados = await resp.json();

      if (!dados.sucesso) {
        alert("❌ E-mail ou senha incorretos. Tente novamente.");
        return;
      }

      // ============================================================
      // 💾 Salva a sessão no localStorage (persistência simples)
      // ============================================================
      localStorage.setItem("usuario_logado", JSON.stringify({
        nome: dados.usuario.nome_usuario,
        email: dados.usuario.email_usuario,
        tipo: dados.usuario.tipo_usuario,
      }));

      // ============================================================
      // 💬 Mensagem de boas-vindas com apelo emocional
      // ============================================================
      alert(`💙 Bem-vindo(a), ${dados.usuario.nome_usuario}!\n\nSua generosidade ilumina caminhos e faz o mundo sonhar mais alto. Continue espalhando esperança!`);

      // Redireciona à página inicial
      window.location.href = "../index.html";

    } catch (err) {
      console.error("Erro ao efetuar login:", err);
      alert("⚠️ Erro ao conectar com o servidor. Tente novamente mais tarde.");
    }
  });
});
