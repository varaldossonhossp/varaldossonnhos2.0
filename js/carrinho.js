// ============================================================
// 💙 VARAL DOS SONHOS — js/carrinho.js
// ------------------------------------------------------------
// Gerencia o carrinho de adoção e envia os dados para a API
// /api/adocoes.js, que:
//   1. Cria o registro na tabela "adocoes" (Airtable)
//   2. Atualiza a cartinha (status = "adotada")
//   3. Dispara e-mail para o ADMINISTRADOR
// ------------------------------------------------------------
// Mensagem final ao doador: "Doação registrada! Aguarde o e-mail
// da Equipe dos Sonhos para confirmar a compra do presente."
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const btnFinalizar = document.getElementById("btn-finalizar");
  if (!btnFinalizar) return;

  btnFinalizar.addEventListener("click", async () => {
    try {
      // 🔹 Coleta os dados do formulário (ou do localStorage)
      const id_cartinha   = localStorage.getItem("id_cartinha");
      const nome_crianca  = localStorage.getItem("nome_crianca");
      const sonho         = localStorage.getItem("sonho");
      const id_usuario    = localStorage.getItem("id_usuario");
      const nome_doador   = localStorage.getItem("nome_usuario");
      const email_doador  = localStorage.getItem("email_usuario");
      const telefone_doador = localStorage.getItem("telefone_usuario");
      const ponto_coleta  = document.querySelector("#select-ponto")?.value || "Ponto Central";

      if (!id_cartinha || !id_usuario) {
        alert("⚠️ Faltam informações para concluir a adoção.");
        return;
      }

      // 🔹 Monta o payload
      const payload = {
        id_cartinha,
        id_usuario,
        nome_doador,
        email_doador,
        telefone_doador,
        ponto_coleta,
        nome_crianca,
        sonho,
      };

      // 🔹 Envia para a API /api/adocoes
      const resp = await fetch("/api/adocoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await resp.json();

      if (!json.sucesso) {
        alert("❌ Ocorreu um erro ao registrar a adoção.");
        console.error(json.mensagem);
        return;
      }

      // 🔹 Mensagem de sucesso
      mostrarMensagemFinal("💙 Doação registrada com sucesso!<br>Aguarde o e-mail da Equipe dos Sonhos para confirmar a compra do presente.");

      // 🔹 Limpa o carrinho (opcional)
      localStorage.removeItem("id_cartinha");
      localStorage.removeItem("nome_crianca");
      localStorage.removeItem("sonho");
    } catch (erro) {
      console.error("Erro ao finalizar adoção:", erro);
      alert("❌ Não foi possível concluir a adoção. Tente novamente.");
    }
  });
});

/**
 * Exibe mensagem final na tela de forma amigável
 */
function mostrarMensagemFinal(msg) {
  const container = document.querySelector(".container-carrinho");
  if (!container) {
    alert(msg.replace(/<br>/g, "\n"));
    return;
  }

  container.innerHTML = `
    <div class="mensagem-final" style="
        text-align:center;
        background:#f0f8ff;
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
