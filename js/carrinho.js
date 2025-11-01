// ============================================================
// 💙 VARAL DOS SONHOS — /js/carrinho.js (versão final com e-mail)
// ------------------------------------------------------------
// Fluxo completo:
//  1️⃣ Carrega a última cartinha do localStorage
//  2️⃣ Exibe os dados na tela (imagem, nome, sonho)
//  3️⃣ Lista pontos de coleta via API
//  4️⃣ Finaliza a adoção:
//      - Cria registro na API /api/adocoes
//      - Atualiza cartinha no Airtable
//      - Envia e-mail via EmailJS
//      - Limpa o carrinho e redireciona
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const imgCartinha = document.getElementById("cartinha-img");
  const nomeSpan = document.getElementById("nome-crianca");
  const sonhoSpan = document.getElementById("sonho-crianca");
  const selectPonto = document.getElementById("select-ponto");
  const btnFinalizar = document.getElementById("btn-finalizar");

  // 1️⃣ Lê o carrinho salvo
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  if (carrinho.length === 0) {
    nomeSpan.textContent = "(nenhuma cartinha selecionada)";
    sonhoSpan.textContent = "Selecione uma cartinha no Varal Virtual.";
    if (btnFinalizar) btnFinalizar.disabled = true;
    return;
  }

  const ultima = carrinho[carrinho.length - 1];

  // 2️⃣ Exibe informações da cartinha
  if (imgCartinha) imgCartinha.src = ultima.fields.imagem_cartinha?.[0]?.url || "../imagens/sem-foto.png";
  if (nomeSpan) nomeSpan.textContent = ultima.fields.nome_crianca || "Criança sem nome";
  if (sonhoSpan) sonhoSpan.textContent = ultima.fields.sonho || "Sonho não informado";

  // 3️⃣ Carrega pontos de coleta
  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();
    if (json.sucesso && Array.isArray(json.pontos)) {
      json.pontos.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.nome_ponto;
        opt.textContent = p.nome_ponto;
        selectPonto.appendChild(opt);
      });
    }
  } catch (erro) {
    console.warn("Erro ao carregar pontos:", erro);
  }

  // 4️⃣ Finalizar adoção
  btnFinalizar?.addEventListener("click", async () => {
    const pontoSelecionado = selectPonto.value;
    if (!pontoSelecionado || pontoSelecionado === "Selecione um ponto...") {
      alert("⚠️ Selecione um ponto de coleta antes de finalizar.");
      return;
    }

    // Dados do usuário logado
    const usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};

    // Monta payload
    const payload = {
      id_cartinha: ultima.id,
      id_usuario: usuario.id,
      nome_doador: usuario.nome,
      email_doador: usuario.email,
      ponto_coleta: pontoSelecionado,
      nome_crianca: ultima.fields.nome_crianca,
      sonho: ultima.fields.sonho,
    };

    try {
      // 🔹 Envia para API /api/adocoes
      const resp = await fetch("/api/adocoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await resp.json();
      if (!json.sucesso) throw new Error(json.mensagem || "Falha na adoção");

      // 🔹 Envia e-mail de confirmação ao doador
      await enviarEmailConfirmacao(usuario.email, usuario.nome, ultima.fields.nome_crianca, pontoSelecionado);

      // 🔹 Mostra mensagem final e limpa carrinho
      mostrarMensagemFinal("💙 Adoção registrada com sucesso!<br>Verifique seu e-mail para mais detalhes.");
      localStorage.removeItem("carrinho");

      // 🔹 Redireciona
      setTimeout(() => window.location.href = "../index.html", 4000);

    } catch (erro) {
      console.error("Erro ao finalizar adoção:", erro);
      alert("❌ Não foi possível concluir a adoção. Tente novamente.");
    }
  });
});

// ============================================================
// 💌 Envio de e-mail via EmailJS
// ============================================================
async function enviarEmailConfirmacao(email, nomeDoador, nomeCrianca, ponto) {
  try {
    const params = {
      to_email: email,
      to_name: nomeDoador,
      child_name: nomeCrianca,
      pickup_point: ponto,
    };

    await emailjs.send(
      "service_uffgnhx",       // service_id
      "template_4yfc899",      // template_id
      params,
      "dPZt5JBiJSLejLZgB"      // public_key
    );

    console.log("✅ E-mail de confirmação enviado!");
  } catch (erro) {
    console.warn("Erro ao enviar e-mail:", erro);
  }
}

// ============================================================
// 📨 Mensagem de sucesso na tela
// ============================================================
function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  if (!container) return alert(msg.replace(/<br>/g, "\n"));

  container.innerHTML = `
    <div class="mensagem-final" style="
        text-align:center;
        background:#f0faff;
        border:2px solid #0078FF;
        border-radius:16px;
        padding:30px;
        margin-top:20px;
        color:#064785;
        font-size:1.1rem;
        line-height:1.6;
        box-shadow:0 4px 12px rgba(0,0,0,0.1);
    ">
      <img src="../imagens/logo-sem-fundo.png" alt="Varal dos Sonhos" width="220" style="margin-bottom:15px;">
      <p>${msg}</p>
      <p style="font-size:0.95rem;margin-top:20px;color:#555;">
        Você receberá um e-mail com os detalhes da sua adoção.<br>
        Obrigado por espalhar amor e realizar sonhos! ✨
      </p>
      <a href="../index.html" style="
          display:inline-block;
          margin-top:18px;
          background:#0078FF;
          color:white;
          text-decoration:none;
          padding:10px 24px;
          border-radius:30px;
          font-weight:600;
      ">Voltar ao início</a>
    </div>
  `;
}
