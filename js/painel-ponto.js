// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js 
// ------------------------------------------------------------
// Painel do ponto de coleta:
// • Lista adoções do ponto logado
// • Modal para confirmar RECEBIMENTO
// • Modal para confirmar RETIRADA (coleta pela equipe)
// • Integra com /api/logistica.js
// ============================================================

// Endpoints
const API_ADOCOES = "/api/adocoes";
const API_LOGISTICA = "/api/logistica";

// ------------------------------------------------------------
// 1) Identificar o ponto logado
// ------------------------------------------------------------
let usuarioLogado = JSON.parse(localStorage.getItem("usuario_logado"));

if (!usuarioLogado || usuarioLogado.tipo !== "ponto") {
  alert("Acesso restrito! Somente pontos de coleta podem acessar este painel.");
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

// ------------------------------------------------------------
// 2) Carregar adoções
// ------------------------------------------------------------
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) {
      console.error("Erro API /adocoes:", json.mensagem);
      return;
    }

    processarAdoacoes(json.adocoes || []);
  } catch (e) {
    console.error("Falha ao carregar adoções:", e);
  }
}

// ------------------------------------------------------------
// 3) Preencher tabelas
// ------------------------------------------------------------
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
      if (a.status_adocao === "confirmada") {
        tReceber.innerHTML += linhaAguardandoRecebimento(a);
      }
      else if (a.status_adocao === "presente recebido") {
        tRetirar.innerHTML += linhaAguardandoRetirada(a);
      }
      else if (a.status_adocao === "presente entregue") {
        tEntregues.innerHTML += linhaEntregue(a);
      }
    });
}

// -------- Template HTML das linhas --------
function linhaAguardandoRecebimento(ado) {
  return `
    <div class="table-row">
      <span>${ado.nome_crianca}</span>
      <span>${ado.sonho}</span>
      <span>${ado.nome_doador}</span>
      <button class="btn btn-receber"
        onclick="abrirModal('receber', '${ado.id_record}')">📥 Receber</button>
    </div>`;
}

function linhaAguardandoRetirada(ado) {
  return `
    <div class="table-row">
      <span>${ado.nome_crianca}</span>
      <span>${ado.sonho}</span>
      <span>${ado.nome_doador}</span>
      <button class="btn btn-retirar"
        onclick="abrirModal('retirar', '${ado.id_record}')">📦 Registrar Retirada</button>
    </div>`;
}

function linhaEntregue(ado) {
  return `
    <div class="table-row">
      <span>${ado.nome_crianca}</span>
      <span>${ado.sonho}</span>
      <span>${ado.nome_doador}</span>
      <span>✔️ Entregue</span>
    </div>`;
}

// ------------------------------------------------------------
// 4) MODAL de Registro
// ------------------------------------------------------------
let acaoAtual = null;
let adocaoAtual = null;

function abrirModal(acao, idAdo) {
  acaoAtual = acao;
  adocaoAtual = idAdo;

  document.getElementById("modalTitulo").textContent =
    acao === "receber"
      ? "Confirmar Recebimento"
      : "Confirmar Retirada";

  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// ------------------------------------------------------------
// 5) Confirmar (Enviar para API /logistica)
// ------------------------------------------------------------
document.getElementById("btnConfirmar").addEventListener("click", async () => {
  const responsavel = document.getElementById("inputResponsavel").value || usuarioLogado.nome_usuario;
  const observacoes = document.getElementById("inputObs").value || "";
  const foto = document.getElementById("inputFoto").value || "";

  const body = {
    acao: acaoAtual,
    id_adocao: adocaoAtual,
    id_ponto: idPonto,
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
    alert("Erro ao registrar operação.");
    console.error(e);
  }
});

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
