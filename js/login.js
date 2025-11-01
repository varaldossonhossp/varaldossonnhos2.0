// ============================================================
// 💙 VARAL DOS SONHOS — /js/login.js (Versão Final TCC)
// ------------------------------------------------------------
// Função: autentica o usuário (doador, voluntário ou admin)
// usando a rota unificada /api/usuarios.
//
// Este módulo é responsável por validar as credenciais,
// enviar os dados à API, salvar a sessão do usuário no
// navegador (localStorage) e redirecionar conforme o tipo
// de perfil.
//
// Fluxo principal:
//   1️⃣ Captura e validação dos campos do formulário
//   2️⃣ Comunicação com a API (acao = "login")
//   3️⃣ Armazenamento da sessão no localStorage
//   4️⃣ Exibição de mensagem motivacional 💌
//   5️⃣ Redirecionamento (Home ou Painel Admin)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  // 🔍 Verificação de segurança — garante que o script
  // só execute se o formulário estiver presente no DOM.
  if (!form) {
    console.error("❌ Formulário de login não encontrado!");
    return;
  }

  // ------------------------------------------------------------
  // 🎯 EVENTO DE SUBMISSÃO DO FORMULÁRIO
  // ------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ============================================================
    // 1️⃣ CAPTURA E VALIDAÇÃO DOS CAMPOS
    // ------------------------------------------------------------
    // Garante que o usuário preencheu os campos obrigatórios
    // antes de enviar a requisição ao servidor.
    // ============================================================
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("⚠️ Preencha todos os campos para continuar!");
      return;
    }

    try {
      // ============================================================
      // 2️⃣ ENVIO DOS DADOS À API
      // ------------------------------------------------------------
      // O sistema utiliza a rota unificada /api/usuarios.
      // O campo “acao: login” indica ao servidor que se trata
      // de uma autenticação (e não cadastro).
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

      // Retorna erro em caso de falha HTTP
      if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);

      const dados = await resp.json();

      // ============================================================
      // 3️⃣ VALIDAÇÃO DA RESPOSTA
      // ------------------------------------------------------------
      // Verifica se o servidor respondeu com sucesso e se o
      // objeto “usuario” foi retornado corretamente.
      // ============================================================
      if (!dados.sucesso || !dados.usuario) {
        alert("❌ E-mail ou senha incorretos. Verifique e tente novamente.");
        return;
      }

      // ============================================================
      // 4️⃣ SALVAMENTO DA SESSÃO NO LOCALSTORAGE
      // ------------------------------------------------------------
      // Os dados essenciais do usuário são salvos localmente
      // para manter o estado de login ativo entre páginas.
      //
      // Observação: padronizado com a chave “usuario” para
      // compatibilidade com o header (componentes.js).
      // ============================================================
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          id: dados.usuario.id || "",
          nome: dados.usuario.nome_usuario || "",
          email: dados.usuario.email_usuario || "",
          tipo: dados.usuario.tipo_usuario || "doador",
        })
      );

      // ============================================================
      // 5️⃣ MENSAGEM EMOCIONAL PERSONALIZADA
      // ------------------------------------------------------------
      // Expressa a identidade afetiva e solidária do projeto,
      // reforçando o propósito social da plataforma.
      // ============================================================
      const nome = dados.usuario.nome_usuario.split(" ")[0];
      alert(
        `💙 Bem-vindo(a), ${nome}!\n\nSua generosidade ilumina caminhos e faz o mundo sonhar mais alto.\nContinue espalhando esperança! 🌟`
      );

      // ============================================================
      // 6️⃣ REDIRECIONAMENTO CONFORME O TIPO DE USUÁRIO
      // ------------------------------------------------------------
      // Após login, o usuário é levado para a página adequada
      // conforme seu perfil: administrador → painel /pages/admin.html,
      // demais → página inicial.
      // ============================================================
      if (dados.usuario.tipo_usuario === "administrador") {
        window.location.href = "../pages/admin.html";
      } else {
        window.location.href = "../index.html";
      }
    } catch (err) {
      // ============================================================
      // ⚠️ TRATAMENTO DE ERROS GERAIS
      // ------------------------------------------------------------
      // Exibe mensagens de falha na comunicação ou exceções do servidor.
      // ============================================================
      console.error("⚠️ Erro ao efetuar login:", err);
      alert("⚠️ Erro ao conectar com o servidor. Tente novamente mais tarde.");
    }
  });
});
