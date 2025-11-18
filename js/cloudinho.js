// ============================================================
// ☁️ CLOUDINHO INTELIGENTE — v5.4 (conexão direta + balão + chat)
// ------------------------------------------------------------
// Componente de chat inteligente que busca respostas na tabela
// "cloudinho" do Airtable via API.
//
// Funcionalidades:
// • Balão flutuante automático com mensagens de boas-vindas
// • Chat interativo com envio de perguntas e exibição de respostas
// • Verificação automática da conexão com a API do Cloudinho
// ============================================================

async function inicializarCloudinho() {
  // Aguarda o HTML do componente ser carregado
  let tentativas = 0;
  while (!document.querySelector(".cloudinho-botao") && tentativas < 20) {
    await new Promise(r => setTimeout(r, 300));
    tentativas++;
  }

  const mascote = document.querySelector(".cloudinho-botao");
  const chat = document.querySelector(".cloudinho-chat");
  const fechar = document.getElementById("fecharCloudinho");
  const form = document.getElementById("formCloudinho");
  const campo = document.getElementById("campoPergunta");
  const mensagens = document.getElementById("chatMensagens");

  if (!mascote || !chat) {
    console.warn("Cloudinho não encontrado no DOM.");
    return;
  }

  // ============================================================
  // 💬 Balão flutuante automático
  // ============================================================
  const mensagensAuto = [
    "Oi 💙 Quer ajuda para adotar um sonho?",
    "Sabia que você pode escolher o ponto de coleta?",
    "Quer ver as cartinhas disponíveis?",
    "Posso te mostrar os próximos eventos?",
  ];
  let indexMsg = 0;

  // Cria o balão (se não existir)
  let balao = document.querySelector(".balao-cloudinho");
  if (!balao) {
    balao = document.createElement("div");
    balao.className = "balao-cloudinho";
    document.body.appendChild(balao);
  }

  function mostrarBalao() {
    balao.textContent = mensagensAuto[indexMsg];
    balao.style.opacity = "1";
    balao.style.transform = "translateY(0)";
    setTimeout(() => {
      balao.style.opacity = "0";
      balao.style.transform = "translateY(10px)";
    }, 6000);
    indexMsg = (indexMsg + 1) % mensagensAuto.length;
  }

  mostrarBalao();
  setInterval(mostrarBalao, 12000);

  // ============================================================
  // 🔗 Verifica se a API do Cloudinho está acessível
  // ============================================================
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

  // ============================================================
  // 💬 Abre e fecha o chat
  // ============================================================
  mascote.addEventListener("click", async () => {
    const aberto = chat.style.display === "flex";
    chat.style.display = aberto ? "none" : "flex";

    if (!aberto) {
      mensagens.innerHTML = "";

      const msgInicial = document.createElement("div");
      msgInicial.className = "msg bot";
      msgInicial.textContent = "Oi 💙 Como posso te ajudar hoje?";
      mensagens.appendChild(msgInicial);

      const conectado = await verificarConexao();
      if (!conectado) {
        const aviso = document.createElement("div");
        aviso.className = "msg bot";
        aviso.textContent =
          "☁️ Estou sem conexão com a Fábrica dos Sonhos, mas posso anotar sua pergunta!";
        mensagens.appendChild(aviso);
      }
    }
  });

  if (fechar) {
    fechar.addEventListener("click", () => (chat.style.display = "none"));
  }

  // ============================================================
  // 📩 Envia mensagem e exibe resposta
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;

    const msgUser = document.createElement("div");
    msgUser.className = "msg usuario";
    msgUser.textContent = texto;
    mensagens.appendChild(msgUser);
    campo.value = "";

    const conectado = await verificarConexao();
    if (!conectado) {
      const msgBot = document.createElement("div");
      msgBot.className = "msg bot";
      msgBot.textContent =
        "☁️ Estou offline agora, mas vou guardar sua pergunta! 💌";
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

  // ============================================================
  // 🔍 Chama a API /api/cloudinho para obter resposta do Airtable
  // ============================================================
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
        return "💭 Ainda não tenho resposta para isso, mas estou aprendendo!";
      }
    } catch (e) {
      console.error("Erro ao buscar resposta:", e);
      return "☁️ Tive um probleminha para falar com a Fábrica dos Sonhos...";
    }
  }
}

window.addEventListener("load", inicializarCloudinho);
