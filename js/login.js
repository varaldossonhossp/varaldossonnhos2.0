// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js (versão final TCC)
// ------------------------------------------------------------
// Realiza o login do usuário (via API /api/usuarios.js),
// valida credenciais e exibe alerta emocional com gamificação.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const feedback = document.getElementById("feedback-msg");

  if (!form) return;

  // ---- Exibe mensagens temporárias de feedback ----
  const mostrarFeedback = (msg, tipo = "sucesso") => {
    feedback.textContent = msg;
    feedback.className = `feedback ${tipo}`;
    feedback.classList.remove("hidden");
    setTimeout(() => feedback.classList.add("hidden"), 5000);
  };

  // ---- Ação principal de login ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      mostrarFeedback("Por favor, preencha e-mail e senha.", "erro");
      return;
    }

    try {
      // 🔹 Consulta API de login
      const resp = await fetch(`/api/usuarios?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);
      const data = await resp.json();

      if (!data.sucesso) {
        mostrarFeedback(data.mensagem || "Credenciais inválidas.", "erro");
        return;
      }

      // 🔐 Armazena dados do usuário no navegador
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      // 🪄 Exibe alerta motivacional com gamificação
      try {
        const id_usuario = data.id_usuario;
        const gamiresp = await fetch(`/api/gamificacao?id_usuario=${id_usuario}`);
        const gamiData = await gamiresp.json();
        const gami = gamiData?.gamificacao;

        if (gami) {
          alert(
            `💙 Bem-vindo de volta, ${data.usuario.nome_usuario}!\n\n` +
            `Você está no nível: ${gami.titulo_conquista}\n` +
            `Pontos de coração: ${gami.pontos_coracao}\n\n` +
            `✨ Continue espalhando sonhos — cada nova adoção te aproxima da próxima conquista! 💫`
          );
        } else {
          alert(
            `💙 Bem-vindo de volta, ${data.usuario.nome_usuario}!\n\n` +
            `Sua jornada está só começando. 🌈 Adote uma nova cartinha e suba de nível na Fábrica dos Sonhos!`
          );
        }
      } catch {
        console.warn("Não foi possível carregar gamificação.");
      }

      // Redireciona após login
      window.location.href = "../index.html";
    } catch (erro) {
      console.error(erro);
      mostrarFeedback("Erro ao conectar com o servidor.", "erro");
    }
  });
});
