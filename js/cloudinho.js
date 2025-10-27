// ============================================================
// ☁️ CLOUDINHO INTELIGENTE — v5.3 (Airtable + Chat Rotativo)
// ------------------------------------------------------------
// Integra com /api/cloudinho sem expor tokens
// Mostra balão animado + chat funcional
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const mascote = document.querySelector(".cloudinho-botao");
  const chat = document.querySelector(".cloudinho-chat");
  const fechar = document.getElementById("fecharCloudinho");
  const form = document.getElementById("formCloudinho");
  const campo = document.getElementById("campoPergunta");
  const mensagens = document.getElementById("chatMensagens");

  if (!mascote || !chat) return;

  // 💬 Mensagens rotativas do balão
  const mensagensAuto = [
    "Oi 💙 Quer ajuda para adotar um sonho?",
    "Sabia que você pode escolher o ponto de coleta?",
    "Quer ver as cartinhas disponíveis?",
    "Posso te mostrar os próximos eventos?",
  ];
  let indexMsg = 0;

  // Cria balão se não existir
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

  // 🔗 Verifica se o servidor está online
  async function verificarConexao() {
    try {
      const resp = await fetch("/api/health", { cache: "no-store" });
      return resp.ok;
    } catch {
      return false;
    }
  }

  // 🎈 Clique no mascote → abre chat
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

  // ❌ Fecha o chat
  if (fechar) {
    fechar.addEventListener("click", () => (chat.style.display = "none"));
  }

  // 📩 Envio da pergunta
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

  // 🔍 Chama a API segura
  async function buscarResposta(pergunta) {
    try {
      const resp = await fetch("/api/cloudinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });
      const data = await resp.json();
      if (data.sucesso && data.resposta) return data.resposta;
      return "💭 Ainda não tenho resposta para isso, mas estou aprendendo!";
    } catch (e) {
      console.error("Erro ao buscar resposta:", e);
      return "☁️ Tive um probleminha para falar com a Fábrica dos Sonhos...";
    }
  }
});
