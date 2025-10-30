// ============================================================
// 🔑 VARAL DOS SONHOS — /js/login.js
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const feedbackMsg = document.getElementById("feedback-msg");
  if (!form) return;

  const exibirFeedback = (mensagem, tipo = "sucesso") => {
    if (!feedbackMsg) return alert(mensagem);
    feedbackMsg.textContent = mensagem;
    feedbackMsg.className = `feedback ${tipo}`;
    feedbackMsg.classList.remove("hidden");
    setTimeout(() => feedbackMsg.classList.add("hidden"), 5000);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const senha = document.getElementById("senha")?.value.trim();
    if (!email || !senha) return exibirFeedback("Preencha e-mail e senha.", "erro");

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Verificando...";

    try {
      const params = new URLSearchParams({ email, senha });
      const resp = await fetch(`/api/usuarios?${params.toString()}`, { method: "GET" });

      // 👇 NÃO tente fazer .json() se a resposta não for OK
      const payload = resp.ok ? await resp.json() : { sucesso: false, mensagem: await resp.text() };

      if (!resp.ok || !payload.sucesso) {
        const msg = payload?.mensagem || `Erro de login (HTTP ${resp.status})`;
        return exibirFeedback(msg, "erro");
      }

      const { usuario, id_usuario } = payload;
      localStorage.setItem("id_usuario_varal", id_usuario);
      localStorage.setItem("nome_usuario_varal", usuario.nome_usuario || "");
      localStorage.setItem("email_usuario_varal", usuario.email_usuario || "");
      localStorage.setItem("tipo_usuario_varal", usuario.tipo_usuario || "doador");

      exibirFeedback(`🎉 Bem-vindo, ${ (usuario.nome_usuario||"").split(" ")[0] }!`, "sucesso");

      setTimeout(() => {
        const redirectUrl = (usuario.tipo_usuario === "administrador" || usuario.tipo_usuario === "voluntario")
          ? "admin.html"
          : "../index.html";
        window.location.href = redirectUrl;
      }, 800);
    } catch (e2) {
      console.error("Erro de rede:", e2);
      exibirFeedback("Erro de conexão. Tente novamente.", "erro");
    } finally {
      btn.disabled = false; btn.textContent = "Entrar";
    }
  });
});
