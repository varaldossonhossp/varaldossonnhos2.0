// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js 
// ------------------------------------------------------------
// Compatível com /api/logistica.js:
// • Ação RECEBER → acao:"receber"
// • Ação COLETAR → acao:"coletar"
// • id_registro (NÃO id_adocao)
// • Modal funcionando (responsável, observações, foto)
// ============================================================

const API_ADOCOES = "/api/adocoes";
const API_LOGISTICA = "/api/logistica";

let usuarioLogado = JSON.parse(localStorage.getItem("usuario_logado"));

if (!usuarioLogado || usuarioLogado.tipo !== "ponto") {
  alert("Acesso restrito!");
  window.location.href = "/index.html";
}

const idPonto =
  usuarioLogado.id_record ||
  usuarioLogado.id ||
  usuarioLogado.id_ponto ||
  null;

if (!idPonto) {
  alert("Erro: ID do ponto não encontrado.");
  window.location.href = "/index.html";
}

// ========================================
// CARREGAR ADOÇÕES
// ========================================
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) return;

    processarAdoacoes(json.adocoes || []);

  } catch (e) {
    console.error("Erro ao carregar adoções", e);
  }
}

// ========================================
// CLASSIFICAR ADOÇÕES
// ========================================
function processarAdoacoes(lista) {

  const tReceber = document.getElementById("listaReceber");
  const tRetirar = document.getElementById("listaRetirar");
  const tEntregues = document.getElementById("listaEntregues");

  tReceber.innerHTML = "";
  tRetirar.innerHTML = "";
  tEntregues.innerHTML = "";

  lista
    .filter(a => a.id_ponto === idPonto)
    .forEach(a => {

      const linha = `
        <tr>
          <td>${a.nome_crianca}</td>
          <td>${a.sonho}</td>
          <td>${a.nome_doador}</td>
          <td>${gerarBotao(a)}</td>
        </tr>
      `;

      if (a.status_adocao === "confirmada") {
        tReceber.innerHTML += linha;
      }

      if (a.status_adocao === "presente recebido") {
        tRetirar.innerHTML += linha;
      }

      if (a.status_adocao === "presente entregue") {
        tEntregues.innerHTML += `
          <tr>
            <td>${a.nome_crianca}</td>
            <td>${a.sonho}</td>
            <td>${a.nome_doador}</td>
            <td>✔️ Entregue</td>
          </tr>
        `;
      }
    });
}

// ========================================
// BOTÕES
// ========================================
function gerarBotao(a) {

  if (a.status_adocao === "confirmada") {
    return `<button class="btn btn-receber"
              onclick="abrirModal('receber','${a.id_record}')">📥 Receber</button>`;
  }

  if (a.status_adocao === "presente recebido") {
    return `<button class="btn btn-retirar"
              onclick="abrirModal('coletar','${a.id_record}')">📦 Registrar Retirada</button>`;
  }

  return "";
}

// ========================================
// MODAL
// ========================================
let acaoAtual = null;
let idAtual = null;

function abrirModal(acao, idAdocao) {
  acaoAtual = acao;
  idAtual = idAdocao;

  document.getElementById("modalTitulo").innerText =
    acao === "receber"
      ? "Confirmar Recebimento"
      : "Registrar Retirada";

  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// ========================================
// CONFIRMAR AÇÃO (RECEBER OU COLETAR)
// ========================================
document.getElementById("btnConfirmar").onclick = async () => {

  const responsavel = document.getElementById("inputResponsavel").value || usuarioLogado.nome || usuarioLogado.nome_usuario;
  const observacoes = document.getElementById("inputObs").value || "";
  const foto = document.getElementById("inputFoto").value || ""; // opcional

  const body = {
    acao: acaoAtual,
    id_registro: idAtual,
    responsavel,
    observacoes,
    foto
  };

  try {
    const r = await fetch(API_LOGISTICA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await r.json();
    alert(json.mensagem);

    fecharModal();
    carregarAdoacoes();

  } catch (e) {
    alert("Erro ao registrar.");
    console.error(e);
  }
};

// ========================================
// INICIAR
// ========================================
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
