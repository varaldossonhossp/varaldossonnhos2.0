// ============================================================
// 💙 VARAL DOS SONHOS — /js/cadastro.js (versão corrigida)
// ------------------------------------------------------------
// Envia os dados do formulário de cadastro para /api/usuarios
// com acao="cadastro" conforme API integrada (cadastro + login).
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
      acao: "cadastro", // 👈 obrigatório para a API entender que é cadastro
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
      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      // ⚙️ Tratamento de resposta não-JSON (ex: erro 404/500)
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Resposta inesperada do servidor: " + text);
      }

      if (resp.ok && json.sucesso) {
        alert("🎉 Cadastro realizado com sucesso! Seja bem-vindo(a) à Fábrica de Sonhos 💙");
        window.location.href = "login.html";
      } else {
        alert("❌ Erro ao cadastrar: " + (json.mensagem || "Erro desconhecido"));
      }
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      alert("⚠️ Falha ao enviar os dados. Tente novamente mais tarde.");
    }
  });
});
