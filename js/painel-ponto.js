// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js 
// ------------------------------------------------------------
// Painel do ponto de coleta:
// • Lista APENAS as adoções ligadas ao ponto logado
// • Modal para confirmar RECEBIMENTO
// • Integra com /api/logistica.js
// ============================================================

const API_ADOCOES = "/api/listAdocoes";
const API_LOGISTICA = "/api/logistica";

// ------------------------------------------------------------
// 1) Identificar Ponto Logado
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// 2) Carregar adoções (via /api/listAdocoes)
// ------------------------------------------------------------
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) {
      console.error("Erro API /listAdocoes:", json.mensagem);
      return;
    }

    processarAdoacoes(json.adocoes || []);
  } catch (e) {
    console.error("Falha ao carregar adoções:", e);
  }
}

// ------------------------------------------------------------
// 3) Processar adoções do PONTO LOGADO
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
        tReceber.innerHTML += templateReceber(a);
      }
      else if (a.status_adocao === "presente recebido") {
        tRetirar.innerHTML += templateRetirar(a);
      }
      else if (a.status_adocao === "presente entregue") {
        tEntregues.innerHTML += templateEntregue(a);
      }
    });
}

// ============================================================
// 📌 NOVOS TEMPLATES → IDÊNTICOS AO VISUAL DO PAINEL ADMIN
// ============================================================

function nomeCrianca(a) {
  return a.primeiro_nome || a.nome_crianca || "Criança";
}

/* -----------------------------------------------------------
   1) AGUARDANDO RECEBIMENTO
----------------------------------------------------------- */
function templateReceber(a) {
  return `
    <div class="card-item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-2">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 ${a.nome_usuario}</span>
      </div>

      <button class="btn-blue mt-4"
        onclick="abrirModal('receber', '${a.id_record}')">
        📥 Receber
      </button>
    </div>
  `;
}

/* -----------------------------------------------------------
   2) RECEBIDOS (aguardando retirar pela equipe)
----------------------------------------------------------- */
function templateRetirar(a) {
  return `
    <div class="card-item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-2">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 ${a.nome_usuario}</span>
        <span class="badge-status badge-recebido">✔ Recebido</span>
      </div>

      <button class="btn-green mt-4"
        onclick="abrirModal('retirar', '${a.id_record}')">
        📦 Registrar Retirada
      </button>
    </div>
  `;
}

/* -----------------------------------------------------------
   3) ENTREGUES
----------------------------------------------------------- */
function templateEntregue(a) {
  return `
    <div class="card-item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-2">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 ${a.nome_usuario}</span>
        <span class="badge-status badge-entregue">🚚 Entregue</span>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// Modal (permanece igual)
// ------------------------------------------------------------
let acaoAtual = null;
let adocaoAtual = null;

function abrirModal(acao, idAdo) {
  acaoAtual = acao;
  adocaoAtual = idAdo;

  document.getElementById("modalTitulo").textContent =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar Retirada";

  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// ------------------------------------------------------------
// Enviar para API
// ------------------------------------------------------------
document.getElementById("btnConfirmar").addEventListener("click", async () => {
  const responsavel =
    document.getElementById("inputResponsavel").value ||
    usuarioLogado.nome_usuario;

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

// Start
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
