// ============================================================
// 💙 VARAL DOS SONHOS — /js/cadastro.js (versão final com CEP + tela de sucesso)
// ------------------------------------------------------------
// Realiza o cadastro de novos usuários (doador/voluntário).
// Busca endereço pelo CEP e exibe confirmação visual igual à adoção.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCadastro");
  const cepInput = document.getElementById("cep");
  const enderecoInput = document.getElementById("endereco");
  const cidadeInput = document.getElementById("cidade");

  if (!form) {
    console.error("❌ Formulário de cadastro não encontrado!");
    return;
  }

  // 🔍 Busca automática pelo CEP via ViaCEP
  if (cepInput) {
    cepInput.addEventListener("blur", async () => {
      const cep = cepInput.value.replace(/\D/g, "");
      if (cep.length !== 8) return;

      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resp.json();
        if (dados.erro) {
          alert("⚠️ CEP não encontrado!");
          enderecoInput.value = "";
          cidadeInput.value = "";
          return;
        }
        enderecoInput.value = dados.logradouro || "";
        cidadeInput.value = dados.localidade || "";
      } catch (erro) {
        console.error("Erro ao buscar CEP:", erro);
      }
    });
  }

  // 📤 Envio do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      acao: "cadastro",
      nome_usuario: document.getElementById("nome").value.trim(),
      email_usuario: document.getElementById("email").value.trim(),
      telefone: document.getElementById("telefone").value.trim(),
      senha: document.getElementById("senha").value.trim(),
      tipo_usuario: document.getElementById("tipo_usuario").value,
      cep: document.getElementById("cep")?.value.trim() || "",
      endereco: document.getElementById("endereco")?.value.trim() || "",
      numero: document.getElementById("numero")?.value.trim() || "",
      cidade: document.getElementById("cidade")?.value.trim() || "",
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

      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Resposta inesperada do servidor: " + text);
      }

      if (resp.ok && json.sucesso) {
        mostrarTelaSucesso();
      } else {
        alert("❌ Erro ao cadastrar: " + (json.mensagem || "Erro desconhecido"));
      }
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      alert("⚠️ Falha ao enviar os dados. Tente novamente mais tarde.");
    }
  });

  // 🎨 Tela de sucesso padronizada (igual à adoção concluída)
  function mostrarTelaSucesso() {
    document.body.innerHTML = `
      <main class="container form-container" style="text-align:center; padding:40px;">
        <section class="card" style="max-width:600px;margin:auto;padding:30px;">
          <img src="../imagens/logo-sem-fundo.png" alt="Fantástica Fábrica de Sonhos" width="220" style="margin-bottom:15px;">
          <h3>💙 Cadastro concluído com sucesso!</h3>
          <p>Seja bem-vindo(a) à <strong>Fantástica Fábrica de Sonhos</strong>.<br>
          Agora você pode acessar sua conta e começar a espalhar sonhos! ✨</p>
          <button id="btnVoltarInicio" class="btn-cadastrar" style="margin-top:20px;">Voltar ao Início</button>
        </section>
      </main>
    `;

    document
      .getElementById("btnVoltarInicio")
      .addEventListener("click", () => (window.location.href = "/index.html"));
  }
});
