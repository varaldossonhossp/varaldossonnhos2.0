// ============================================================
// 💙 VARAL DOS SONHOS — /js/cadastro.js
// ------------------------------------------------------------
// Função: Enviar os dados do formulário de cadastro para a API.
// Armazena o novo usuário na tabela "usuarios" (Airtable).
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCadastro");

  if (!form) {
    console.error("❌ Formulário de cadastro não encontrado!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      nome_usuario: document.getElementById("nome").value.trim(),
      email_usuario: document.getElementById("email").value.trim(),
      telefone: document.getElementById("telefone").value.trim(),
      senha: document.getElementById("senha").value.trim(),
      tipo_usuario: document.getElementById("tipo_usuario").value,
    };

    if (!dados.nome_usuario || !dados.email_usuario || !dados.senha) {
      alert("⚠️ Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      const resp = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const json = await resp.json();

      if (json.sucesso) {
        alert("🎉 Cadastro realizado com sucesso! Seja bem-vindo(a) à Fábrica de Sonhos 💙");
        window.location.href = "login.html";
      } else {
        alert("❌ Erro ao cadastrar: " + json.mensagem);
      }
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      alert("⚠️ Ocorreu um erro ao enviar os dados. Tente novamente mais tarde.");
    }
  });
});
