// ============================================================
// 🔐 VARAL DOS SONHOS — /js/login.js (versão TCC)
// ------------------------------------------------------------
// Controla o fluxo de login dos usuários.
// Envia email/senha à rota /api/usuarios.js (GET) e valida retorno.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const feedbackMsg = document.getElementById("feedback-msg");

  // ============================================================
  // 💬 Exibe mensagens ao usuário
  // ============================================================
  const exibirFeedback = (mensagem, tipo = "erro") => {
    feedbackMsg.textContent = mensagem;
    feedbackMsg.className = `feedback ${tipo}`;
    feedbackMsg.classList.remove("hidden");
    setTimeout(() => feedbackMsg.classList.add("hidden"), 4000);
  };

  // ============================================================
  // 🚀 Evento de envio do formulário
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      exibirFeedback("Preencha todos os campos obrigatórios.", "erro");
      return;
    }

    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Entrando...";

    try {
      // 📡 Requisição para API de login
      const resp = await fetch(`/api/usuarios?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);
      const data = await resp.json();

      if (!resp.ok || !data.sucesso) {
        exibirFeedback(data?.mensagem || "Credenciais inválidas.", "erro");
        btn.disabled = false;
        btn.textContent = "Entrar";
        return;
      }

      // ✅ Login realizado com sucesso
      exibirFeedback("✅ Login efetuado com sucesso!", "sucesso");

      // 💾 Armazena o usuário localmente (para futuras páginas)
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      // Redireciona conforme tipo de usuário
      const tipo = data.usuario.tipo_usuario?.toLowerCase();
      setTimeout(() => {
        if (tipo === "administrador") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "../index.html";
        }
      }, 1200);

    } catch (err) {
      console.error(err);
      exibirFeedback("Erro de conexão. Tente novamente.", "erro");
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
});
