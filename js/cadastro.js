// ============================================================
// 👥 VARAL DOS SONHOS — /js/cadastro.js (versão TCC)
// ------------------------------------------------------------
// Responsável pela validação do formulário e comunicação com a API.
// - Integração: /api/usuarios.js
// - Recursos extras: ViaCEP para autocompletar endereço.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCadastro");
  const feedbackMsg = document.getElementById("feedback-msg");
  if (!form) return;

  // ============================================================
  // 💬 Função para exibir mensagens de feedback ao usuário
  // ------------------------------------------------------------
  // Tipo: 'sucesso' (verde) ou 'erro' (vermelho)
  // ============================================================
  const exibirFeedback = (mensagem, tipo = "sucesso") => {
    feedbackMsg.textContent = mensagem;
    feedbackMsg.className = `feedback ${tipo}`;
    feedbackMsg.classList.remove("hidden");
    setTimeout(() => feedbackMsg.classList.add("hidden"), 5000);
  };

  // ============================================================
  // 📦 Auto-preenchimento do endereço via CEP (API ViaCEP)
  // ============================================================
  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("blur", async () => {
      const cep = cepInput.value.replace(/\D/g, "");
      if (cep.length !== 8) return;

      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!resp.ok) return;
        const dados = await resp.json();
        if (dados.erro) return;

        document.getElementById("endereco").value = 
          [dados.logradouro, dados.bairro].filter(Boolean).join(" - ");
        document.getElementById("cidade").value = 
          [dados.localidade, dados.uf].filter(Boolean).join("/");
      } catch (e) {
        console.warn("Erro ao buscar CEP:", e);
      }
    });
  }

  // ============================================================
  // 🧾 ENVIO DO FORMULÁRIO
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedbackMsg.classList.add("hidden");

    // Lista de campos obrigatórios
    const camposObrigatorios = [
      "nome_usuario", "cep", "endereco", "numero", "cidade",
      "email_usuario", "telefone", "tipo_usuario", "senha"
    ];

    // Verificação simples
    for (const id of camposObrigatorios) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        exibirFeedback("Por favor, preencha todos os campos obrigatórios.", "erro");
        return;
      }
    }

    // Prepara o corpo da requisição
    const payload = Object.fromEntries(
      camposObrigatorios.map(id => [id, document.getElementById(id).value.trim()])
    );

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Cadastrando...";

    try {
      // Envia para o servidor (rota /api/usuarios.js)
      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.sucesso) {
        exibirFeedback(data?.mensagem || "Erro ao cadastrar usuário.", "erro");
        return;
      }

      // Sucesso: exibe mensagem e redireciona
      exibirFeedback("🎉 Cadastro realizado com sucesso! Redirecionando...", "sucesso");
      form.reset();
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch (err) {
      console.error("Erro de rede:", err);
      exibirFeedback("Erro de conexão. Tente novamente.", "erro");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Cadastrar";
    }
  });
});
