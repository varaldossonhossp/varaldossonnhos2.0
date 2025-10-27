// 💬 Cloudinho - Chat com base de conhecimento (Airtable)
document.addEventListener("DOMContentLoaded", () => {
  const painel = document.getElementById("painelCloudinho");
  const botao = document.getElementById("btnCloudinho");
  const fechar = document.getElementById("fecharCloudinho");
  const form = document.getElementById("formCloudinho");
  const campo = document.getElementById("campoPergunta");
  const chat = document.getElementById("chatMensagens");

  const append = (txt, quem) => {
    const div = document.createElement("div");
    div.className = "msg " + quem;
    div.textContent = txt;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  };

  botao.addEventListener("click", () => painel.toggleAttribute("hidden"));
  fechar.addEventListener("click", () => painel.setAttribute("hidden", true));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const pergunta = campo.value.trim();
    if (!pergunta) return;
    append(pergunta, "usuario");
    campo.value = "";

    try {
      const r = await fetch("/api/cloudinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta })
      });
      const j = await r.json();
      append(j.resposta || "Ainda não aprendi isso 💭", "bot");
    } catch {
      append("Ops, estou sem conexão agora 😅", "bot");
    }
  });
});
