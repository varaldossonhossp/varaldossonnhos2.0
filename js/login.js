// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js (Versão Final TCC)
// ------------------------------------------------------------
// Função: autentica o usuário (doador, voluntário ou admin)
// usando a rota unificada /api/usuarios.
// Fluxo:
//   1️⃣ Valida campos do formulário
//   2️⃣ Envia dados à API com acao="login"
//   3️⃣ Salva a sessão no localStorage
//   4️⃣ Exibe mensagem motivacional 💌
//   5️⃣ Redireciona para a página inicial
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  if (!form) {
    console.error("❌ Formulário de login não encontrado!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ============================================================
    // 1️⃣ Captura e validação dos campos
    // ============================================================
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("⚠️ Preencha todos os campos para continuar!");
      return;
    }

    try {
      // ============================================================
      // 2️⃣ Envio dos dados ao servidor
      // ------------------------------------------------------------
      // Importante: como o login está dentro da rota /api/usuarios,
      // enviamos o campo 'acao: "login"' para que a API saiba
      // qual bloco de código executar.
      // ============================================================
      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "login",
          email_usuario: email,
          senha: senha,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Erro HTTP ${resp.status}`);
      }

      const dados = await resp.json();

      // ============================================================
      // 3️⃣ Validação da resposta
      // ============================================================
      if (!dados.sucesso || !dados.usuario) {
        alert("❌ E-mail ou senha incorretos. Verifique e tente novamente.");
        return;
      }

      // ============================================================
      // 4️⃣ Salva dados da sessão no localStorage
      // ------------------------------------------------------------
      // Armazena as informações essenciais do usuário logado
      // para uso global (exibição no header, carrinho, etc.).
      // ============================================================
      localStorage.setItem(
        "usuario_logado",
        JSON.stringify({
          id: dados.usuario.id || "",
          nome: dados.usuario.nome_usuario || "",
          email: dados.usuario.email_usuario || "",
          tipo: dados.usuario.tipo_usuario || "doador",
        })
      );

      // ============================================================
      // 5️⃣ Mensagem emocional personalizada
      // ------------------------------------------------------------
      // Pequeno toque afetivo alinhado à identidade solidária
      // do projeto "Fantástica Fábrica de Sonhos".
      // ============================================================
      const nome = dados.usuario.nome_usuario.split(" ")[0];
      alert(
        `💙 Bem-vindo(a), ${nome}!\n\nSua generosidade ilumina caminhos e faz o mundo sonhar mais alto.\nContinue espalhando esperança! 🌟`
      );

      // ============================================================
      // 6️⃣ Redirecionamento conforme tipo de usuário
      // ============================================================
      if (dados.usuario.tipo_usuario === "administrador") {
        window.location.href = "../pages/admin.html";
      } else {
        window.location.href = "../index.html";
      }
    } catch (err) {
      console.error("⚠️ Erro ao efetuar login:", err);
      alert("⚠️ Erro ao conectar com o servidor. Tente novamente mais tarde.");
    }
  });
});
