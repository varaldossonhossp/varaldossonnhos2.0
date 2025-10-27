// ============================================================
// ☁️ CLOUDINHO INTELIGENTE — v5.1
// ------------------------------------------------------------
// Usa componente modular + API segura (/api/cloudinho)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const mascote = document.querySelector(".cloudinho-botao");
  const chat = document.querySelector(".cloudinho-chat");
  const fechar = document.getElementById("fecharCloudinho");
  const form = document.getElementById("formCloudinho");
  const campo = document.getElementById("campoPergunta");
  const mensagens = document.getElementById("chatMensagens");

  if (!mascote || !chat) return;

  // 🌤️ Balão automático
  const mensagensAuto = [
    "Oi 💙 Quer ajuda para adotar um sonho?",
    "Sabia que você pode escolher o ponto de coleta?",
    "Quer ver as cartinhas disponíveis?",
    "Posso te mostrar os próximos eventos?",
  ];
  let indexMsg = 0;

  function mostrarBalao() {
    let balao = document.querySelector(".balao-cloudinho");
    if (!balao) {
      balao = document.createElement("div");
      balao.className = "balao-cloudinho";
      document.body.appendChild(balao);
    }
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

  // 💬 Abrir chat
  mascote.addEventListener("click", () => {
    const aberto = chat.style.display === "flex";
    chat.style.display = aberto ? "none" : "flex";
    if (!aberto) {
      mensagens.innerHTML = "";
      const msgInicial = document.createElement("div");
      msgInicial.className = "msg bot";
      msgInicial.textContent = "Oi 💙 Como posso te ajudar hoje?";
      mensagens.appendChild(msgInicial);
    }
  });

  // ❌ Fechar chat
  fechar?.addEventListener("click", () => {
    chat.style.display = "none";
  });

  // 📩 Enviar pergunta
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;

    const msgUser = document.createElement("div");
    msgUser.className = "msg usuario";
    msgUser.textContent = texto;
    mensagens.appendChild(msgUser);
    campo.value = "";

    try {
      const resp = await fetch("/api/cloudinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto }),
      });

      const data = await resp.json();
      const msgBot = document.createElement("div");
      msgBot.className = "msg bot";
      msgBot.textContent =
        data.resposta ||
        "☁️ Ainda não encontrei uma resposta para isso, mas estou aprendendo!";
      mensagens.appendChild(msgBot);
      mensagens.scrollTop = mensagens.scrollHeight;
    } catch (e) {
      console.error("Erro Cloudinho:", e);
      const msgBot = document.createElement("div");
      msgBot.className = "msg bot erro";
      msgBot.textContent =
        "☁️ Tive um probleminha para falar com a Fábrica dos Sonhos...";
      mensagens.appendChild(msgBot);
    }
  });
});
