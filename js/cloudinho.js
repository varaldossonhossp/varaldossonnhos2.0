// ============================================================
// ☁️ VARAL DOS SONHOS — /js/cloudinho.js
// ------------------------------------------------------------
// Função: Controlar o chat do assistente Cloudinho.
// Puxa respostas da tabela “cloudinho” via /api/cloudinho.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("cloudinho-toggle");
  const chat = document.getElementById("cloudinho-chat");
  const close = document.getElementById("cloudinho-close");
  const sendBtn = document.getElementById("cloudinho-send");
  const input = document.getElementById("cloudinho-input");
  const messages = document.getElementById("cloudinho-messages");

  // ===== Alternar visibilidade =====
  toggle.addEventListener("click", () => chat.classList.toggle("hidden"));
  close.addEventListener("click", () => chat.classList.add("hidden"));

  // ===== Envio da mensagem =====
  sendBtn.addEventListener("click", enviarMensagem);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });

  function adicionarMensagem(texto, tipo = "bot") {
    const msg = document.createElement("div");
    msg.classList.add("cloudinho-msg", tipo === "user" ? "user-msg" : "bot-msg");
    msg.textContent = texto;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  async function enviarMensagem() {
    const pergunta = input.value.trim();
    if (!pergunta) return;

    adicionarMensagem(pergunta, "user");
    input.value = "";

    try {
      const resposta = await fetch(`/api/cloudinho?pergunta=${encodeURIComponent(pergunta)}`);
      const data = await resposta.json();

      // Resposta padrão de fallback
      const textoResposta =
        data.resposta ||
        "Desculpe, ainda não sei responder isso. Você pode entrar em contato conosco pela página Fale Conosco 💙";

      adicionarMensagem(textoResposta, "bot");
    } catch (err) {
      console.error("Erro ao buscar resposta do Cloudinho:", err);
      adicionarMensagem("Houve um erro ao conectar com o servidor 😢", "bot");
    }
  }
});
