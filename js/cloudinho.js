// ============================================================
// ☁️ CLOUDINHO CONTEXTUAL INTELIGENTE — v6.0
// ------------------------------------------------------------
// • Usa o componente HTML: componentes/cloudinho.html
// • Usa a API:           /api/cloudinho  (Airtable: tabela "cloudinho")
// • Detecta a página atual (login, cartinha, carrinho, painéis, etc.)
// • Mostra balões diferentes conforme o contexto da página
// • Dá boas-vindas especiais na página de LOGIN
// • Usa nome do usuário (se existir em localStorage.usuario)
// ============================================================

async function inicializarCloudinho() {
  // Aguarda o HTML do componente ser carregado
  let tentativas = 0;
  while (!document.querySelector(".cloudinho-botao") && tentativas < 20) {
    await new Promise((r) => setTimeout(r, 300));
    tentativas++;
  }

  const mascote   = document.querySelector(".cloudinho-botao");
  const chat      = document.querySelector(".cloudinho-chat");
  const fechar    = document.getElementById("fecharCloudinho");
  const form      = document.getElementById("formCloudinho");
  const campo     = document.getElementById("campoPergunta");
  const mensagens = document.getElementById("chatMensagens");

  if (!mascote || !chat || !form || !campo || !mensagens) {
    console.warn("Cloudinho: elementos do DOM não encontrados.");
    return;
  }

  // ==========================================================
  // 👤 Tenta pegar o usuário logado (para usar o primeiro nome)
  // ==========================================================
  let usuario = null;
  let primeiroNome = null;
  try {
    const rawUser = localStorage.getItem("usuario");
    if (rawUser) {
      usuario = JSON.parse(rawUser);
      if (usuario?.nome) {
        primeiroNome = String(usuario.nome).split(" ")[0];
      }
    }
  } catch (e) {
    console.warn("Cloudinho: erro ao ler usuário do localStorage:", e);
  }

  // ==========================================================
  // 🌐 Detectar contexto da página (rota atual)
  // ==========================================================
  function obterContextoPagina() {
    const path = window.location.pathname || "";

    if (path.includes("login"))          return "login";
    if (path.includes("cadastro"))       return "cadastro";
    if (path.includes("cartinha"))       return "varal";
    if (path.includes("carrinho"))       return "carrinho";
    if (path.includes("painel-ponto"))   return "painel_ponto";
    if (path.includes("painel-doador"))  return "painel_doador";
    if (path.includes("eventos"))        return "eventos";
    if (path.includes("pontosdecoleta")) return "pontos";
    if (path === "/" || path.endsWith("index.html")) return "home";

    return "geral";
  }

  const contexto = obterContextoPagina();

  // ==========================================================
  // 💬 Mensagens automáticas por contexto (balão flutuante)
  // ==========================================================
  function obterMensagensAuto(ctx) {
    switch (ctx) {
      case "login":
        return [
          primeiroNome
            ? `Oi, ${primeiroNome}! 💙 Precisa de ajuda para acessar sua conta?`
            : "Bem-vindo(a) de volta! 💙 Precisa de ajuda para entrar?",
          "Se não conseguir fazer login, posso te orientar sobre cadastro. 😉",
        ];

      case "cadastro":
        return [
          "Oi! 💙 Posso te ajudar com o cadastro, se tiver alguma dúvida.",
          "Ficou em dúvida em algum campo do cadastro? Pergunta pra mim! ☁️",
        ];

      case "varal":
        return [
          "Oi 💙 Quer ajuda para escolher uma cartinha no Varal Virtual?",
          "Sabia que você pode ver mais detalhes da cartinha clicando na imagem? 😉",
          "Se quiser, posso te explicar como funciona a adoção das cartinhas.",
        ];

      case "carrinho":
        return [
          "Vejo que você já escolheu um sonho. 💙 Precisa de ajuda para finalizar a adoção?",
          "Se tiver dúvida sobre pontos de coleta, posso te explicar como funciona. 📦",
        ];

      case "painel_ponto":
        return [
          "Bem-vindo ao painel do Ponto de Coleta! 💙 Precisa de ajuda para registrar recebimento ou retirada?",
          "Posso te lembrar como funciona o fluxo: receber presente, depois registrar retirada. 😉",
        ];

      case "painel_doador":
        return [
          "Aqui você acompanha suas adoções. 💙 Quer ajuda para entender os status?",
          "Posso te explicar o que significa cada etapa: aguardando confirmação, recebido, entregue.",
        ];

      case "eventos":
        return [
          "Quer saber mais sobre os eventos de entrega de presentes? 💙",
          "Posso te contar como funcionam os eventos da Fantástica Fábrica de Sonhos.",
        ];

      case "pontos":
        return [
          "Está escolhendo um ponto de coleta? Posso explicar como funciona. 📦",
          "Ficou em dúvida sobre onde entregar o presente? Pergunta pra mim! ☁️",
        ];

      case "home":
        return [
          "Oi 💙 Bem-vindo(a) ao Varal dos Sonhos! Posso te ajudar a começar?",
          "Quer entender como funciona a adoção das cartinhas? É só perguntar! ✨",
        ];

      default:
        return [
          "Oi 💙 Sou o Cloudinho, posso te ajudar com o Varal dos Sonhos!",
          "Se tiver qualquer dúvida sobre cartinhas, pontos ou eventos, é só me chamar. ☁️",
        ];
    }
  }

  const mensagensAuto = obterMensagensAuto(contexto);
  let indexMsg = 0;

  // ==========================================================
  // 💭 Balão flutuante — contexto + animação
  // ==========================================================
  let balao = document.querySelector(".balao-cloudinho");
  if (!balao) {
    balao = document.createElement("div");
    balao.className = "balao-cloudinho";
    document.body.appendChild(balao);
  }

  function mostrarBalao() {
    if (!mensagensAuto.length) return;
    balao.textContent = mensagensAuto[indexMsg];
    balao.style.opacity = "1";
    balao.style.transform = "translateY(0)";
    setTimeout(() => {
      balao.style.opacity = "0";
      balao.style.transform = "translateY(10px)";
    }, 6000);
    indexMsg = (indexMsg + 1) % mensagensAuto.length;
  }

  // dispara primeiro balão e depois repete
  mostrarBalao();
  setInterval(mostrarBalao, 12000);

  // ==========================================================
  // 🔗 Verifica se a API do Cloudinho está acessível
  // ==========================================================
  async function verificarConexao() {
    try {
      const resp = await fetch("/api/cloudinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: "teste" }),
      });
      const data = await resp.json();
      return data?.sucesso !== false;
    } catch (e) {
      console.warn("Cloudinho offline:", e.message);
      return false;
    }
  }

  // ==========================================================
  // 💌 Saudação inicial no chat (diferente por página)
  // ==========================================================
  function obterSaudacaoInicial() {
    const nome = primeiroNome ? `${primeiroNome}` : null;

    switch (contexto) {
      case "login":
        return nome
          ? `Oi, ${nome}! 💙 Que bom te ver por aqui de novo. Se precisar de ajuda com login ou senha, é só falar comigo.`
          : "Oi 💙 Bem-vindo(a)! Se tiver qualquer dificuldade para entrar ou recuperar a senha, estou aqui para ajudar.";

      case "cadastro":
        return "Oi 💙 Eu posso te acompanhar no cadastro, se tiver dúvida em algum campo é só perguntar!";

      case "varal":
        return "Oi 💙 Vejo que você está no Varal Virtual! Se quiser, posso te explicar como escolher uma cartinha.";

      case "carrinho":
        return "Uau, você já tem sonhos no carrinho! 🎁 Se precisar de ajuda para finalizar, escolha do ponto ou entender o fluxo, pergunta pra mim.";

      case "painel_ponto":
        return "Bem-vindo ao painel do Ponto de Coleta! 💙 Posso te ajudar a lembrar como registrar recebimentos e retiradas.";

      case "painel_doador":
        return "Aqui você acompanha suas adoções. 💙 Se quiser, eu explico o que significa cada status e o próximo passo.";

      case "eventos":
        return "Este é o espaço dos eventos da Fantástica Fábrica de Sonhos! 💙 Quer saber como funcionam as entregas?";

      case "home":
        return "Oi 💙 Bem-vindo(a) ao Varal dos Sonhos! Posso te contar rapidinho como tudo funciona.";

      default:
        return "Oi 💙 Eu sou o Cloudinho, mascote da Fantástica Fábrica de Sonhos. Como posso te ajudar hoje?";
    }
  }

  // ==========================================================
  // 💬 Abre e fecha o chat
  // ==========================================================
  mascote.addEventListener("click", async () => {
    const aberto = chat.style.display === "flex";
    chat.style.display = aberto ? "none" : "flex";

    if (!aberto) {
      // limpando mensagens antigas sempre que abrir
      mensagens.innerHTML = "";

      const msgInicial = document.createElement("div");
      msgInicial.className = "msg bot";
      msgInicial.textContent = obterSaudacaoInicial();
      mensagens.appendChild(msgInicial);

      const conectado = await verificarConexao();
      if (!conectado) {
        const aviso = document.createElement("div");
        aviso.className = "msg bot";
        aviso.textContent =
          "☁️ Estou sem conexão com a Fábrica dos Sonhos agora, mas posso anotar suas dúvidas! 💌";
        mensagens.appendChild(aviso);
      }

      mensagens.scrollTop = mensagens.scrollHeight;
    }
  });

  if (fechar) {
    fechar.addEventListener("click", () => (chat.style.display = "none"));
  }

  // ==========================================================
  // 📩 Envia mensagem e exibe resposta
  // ==========================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;

    const msgUser = document.createElement("div");
    msgUser.className = "msg usuario";
    msgUser.textContent = texto;
    mensagens.appendChild(msgUser);
    campo.value = "";

    mensagens.scrollTop = mensagens.scrollHeight;

    const conectado = await verificarConexao();
    if (!conectado) {
      const msgBot = document.createElement("div");
      msgBot.className = "msg bot";
      msgBot.textContent =
        "☁️ Estou offline agora, mas vou guardar sua pergunta no coração! 💙";
      mensagens.appendChild(msgBot);
      mensagens.scrollTop = mensagens.scrollHeight;
      return;
    }

    const resposta = await buscarResposta(texto);
    const msgBot = document.createElement("div");
    msgBot.className = "msg bot";
    msgBot.textContent = resposta;
    mensagens.appendChild(msgBot);
    mensagens.scrollTop = mensagens.scrollHeight;
  });

  // ==========================================================
  // 🔍 Chama a API /api/cloudinho (Airtable) para obter resposta
  // ==========================================================
  async function buscarResposta(pergunta) {
    try {
      const resp = await fetch("/api/cloudinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });

      const data = await resp.json();
      if (data.sucesso && data.resposta) {
        return data.resposta;
      } else {
        return "💭 Ainda não tenho uma resposta prontinha pra isso, mas estou aprendendo todo dia!";
      }
    } catch (e) {
      console.error("Erro ao buscar resposta do Cloudinho:", e);
      return "☁️ Tive um probleminha para falar com a Fábrica dos Sonhos agora, tente de novo em instantes.";
    }
  }
}

// Inicializa após o carregamento da janela
window.addEventListener("load", inicializarCloudinho);
