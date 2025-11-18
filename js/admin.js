// ============================================================
// VARAL DOS SONHOS — /js/admin.js
// ------------------------------------------------------------
// Painel de administração: lista e confirma adoções.
// Ao confirmar, muda o status no Airtable e dispara e-mail
// de confirmação automática para o doador.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const tabela = document.querySelector("#tabelaAdocoes tbody");

  // ============================================================
  // 1️⃣ Valida o tipo de usuário (apenas administradores)
  // ============================================================
  const usuario = JSON.parse(localStorage.getItem("usuario_logado"));
  if (!usuario || usuario.tipo !== "administrador") {
    alert("⛔ Acesso restrito! Somente administradores podem acessar esta área.");
    window.location.href = "../index.html";
    return;
  }

  // ============================================================
  // 2️⃣ Função para carregar todas as adoções da API
  // ============================================================
  async function carregarAdocoes() {
    try {
      const resp = await fetch("/api/adocoes");
      const dados = await resp.json();

      if (!dados.sucesso || !dados.adocoes.length) {
        tabela.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhuma adoção pendente 💌</td></tr>`;
        return;
      }

      tabela.innerHTML = ""; // limpa

      dados.adocoes.forEach((a) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${a.nome_crianca || "-"}</td>
          <td>${a.sonho || "-"}</td>
          <td>${a.nome_doador || "-"}<br><small>${a.email_doador || ""}</small></td>
          <td>${a.ponto_coleta || "-"}</td>
          <td>${new Date(a.data_adocao).toLocaleDateString("pt-BR")}</td>
          <td>${a.status_adocao}</td>
          <td>
            ${
              a.status_adocao === "aguardando confirmacao"
                ? `<button class="btn-confirmar" data-id="${a.id_adocao}" data-email="${a.email_doador}" data-cartinha="${a.id_cartinha}">Confirmar ✅</button>`
                : `<span style="color:#2ecc71;">✔️ Confirmada</span>`
            }
          </td>
        `;
        tabela.appendChild(tr);
      });

      adicionarEventosConfirmar();
    } catch (erro) {
      console.error("Erro ao carregar adoções:", erro);
      tabela.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Erro ao buscar dados.</td></tr>`;
    }
  }

  // ============================================================
  // 3️⃣ Confirmação da adoção + atualização no Airtable
  // ============================================================
  function adicionarEventosConfirmar() {
    document.querySelectorAll(".btn-confirmar").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const email = btn.dataset.email;
        const cartinha = btn.dataset.cartinha;

        if (!confirm("Deseja confirmar esta adoção e enviar o e-mail ao doador?")) return;

        try {
          const resp = await fetch("/api/adocoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              acao: "confirmar",
              id_adocao: id,
              email_doador: email,
              id_cartinha: cartinha,
            }),
          });

          const resultado = await resp.json();
          if (resultado.sucesso) {
            alert("💙 Adoção confirmada com sucesso!\nE-mail enviado ao doador com instruções.");
            carregarAdocoes();
          } else {
            alert("⚠️ Erro ao confirmar adoção: " + resultado.mensagem);
          }
        } catch (e) {
          console.error("Erro ao confirmar:", e);
          alert("❌ Falha ao enviar confirmação. Tente novamente.");
        }
      });
    });
  }

  // ============================================================
  // 4️⃣ Inicialização
  // ============================================================
  carregarAdocoes();
});
