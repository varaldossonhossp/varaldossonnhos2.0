// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js 
// ------------------------------------------------------------
// Painel do Ponto de Coleta:
// • Lista APENAS adoções ligadas ao ponto logado
// • Layout padronizado 
// • Modal para confirmar RECEBIMENTO ou RETIRADA
// • Integra com /api/logistica.js
//   ✔ primeiro nome da criança
//   ✔ id_cartinha
//   ✔ sonho
//   ✔ nome_usuario (doador)
//   ✔ status
//   ✔ observações 
//
// Totalmente compatível com a /api/listAdocoes.js
// ============================================================


const API_ADOCOES = "/api/listAdocoes";
const API_LOGISTICA = "/api/logistica";

// ---------------------------------------------
// 1) Identificar Ponto Logado
// ---------------------------------------------
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

// ---------------------------------------------
// 2) Buscar adoções
// ---------------------------------------------
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) {
      console.error("Erro API /listAdocoes:", json.mensagem);
      return;
    }

    const minhas = (json.adocoes || []).filter(a => a.id_ponto === idPonto);
    renderizar(minhas);

  } catch (e) {
    console.error("Falha ao carregar adoções:", e);
  }
}

// ---------------------------------------------
// 3) Renderizar cards por status
// ---------------------------------------------
function renderizar(lista) {

  const tReceber = document.getElementById("listaReceber");
  const tRetirar = document.getElementById("listaRetirar");
  const tEntregues = document.getElementById("listaEntregues");

  tReceber.innerHTML = "";
  tRetirar.innerHTML = "";
  tEntregues.innerHTML = "";

  lista.forEach(ado => {

    if (ado.status_adocao === "confirmada") {
      tReceber.innerHTML += cardReceber(ado);
    }

    else if (ado.status_adocao === "presente recebido") {
      tRetirar.innerHTML += cardRecebido(ado);
    }

    else if (ado.status_adocao === "presente entregue") {
      tEntregues.innerHTML += cardEntregue(ado);
    }
  });
}

/* ============================================================
   🔵 TEMPLATES (com Observações apenas)
============================================================ */

function cardReceber(a) {
  return `
    <div class="ado-item">
      <p class="font-bold text-xl">${a.nome_crianca}</p>
      <p class="text-gray-700 mb-2">🎁 ${a.sonho}</p>

      <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
      <span class="tag">👤 Doador: ${a.nome_usuario}</span>

      ${blocoObservacoes(a.movimentos)}

      <button class="btn-blue mt-4"
        onclick="abrirModal('receber', '${a.id_record}')">
        📥 Receber
      </button>
    </div>
  `;
}

function cardRecebido(a) {
  return `
    <div class="ado-item">
      <p class="font-bold text-xl">${a.nome_crianca}</p>
      <p class="text-gray-700 mb-2">🎁 ${a.sonho}</p>

      <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
      <span class="tag">👤 Doador: ${a.nome_usuario}</span>

      ${blocoObservacoes(a.movimentos)}

      <button class="btn-blue mt-4"
        onclick="abrirModal('retirar', '${a.id_record}')">
        📦 Registrar Retirada
      </button>
    </div>
  `;
}

function cardEntregue(a) {
  return `
    <div class="ado-item">
      <p class="font-bold text-xl">${a.nome_crianca}</p>
      <p class="text-gray-700 mb-2">🎁 ${a.sonho}</p>

      <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
      <span class="tag">👤 Doador: ${a.nome_usuario}</span>

      ${blocoObservacoes(a.movimentos)}
    </div>
  `;
}

/* ============================================================
   🟩 BLOCO NOVO — SOMENTE OBSERVAÇÕES
============================================================ */
function blocoObservacoes(movs) {

  // se não há nenhum movimento
  if (!movs || movs.length === 0) {
    return `
      <div class="section-block">
        <p class="font-semibold text-blue-700 mb-1">📝 Observações</p>
        <p class="text-gray-600 text-sm">Nenhuma observação registrada.</p>
      </div>
    `;
  }

  // pegar apenas a última observação
  const ultima = movs[movs.length - 1];

  return `
    <div class="section-block">
      <p class="font-semibold text-blue-700 mb-1">📝 Observações</p>
      <p class="text-gray-700 text-sm">
        ${ultima.observacoes || "—"}
      </p>
    </div>
  `;
}

/* ============================================================
   🔶 Modal
============================================================ */

let acaoAtual = null;
let adocaoAtual = null;

function limparModal() {
  document.getElementById("inputResponsavel").value = "";
  document.getElementById("inputObs").value = "";
}

function abrirModal(acao, idAdo) {
  acaoAtual = acao;
  adocaoAtual = idAdo;

  limparModal();

  document.getElementById("modalTitulo").textContent =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar Retirada";

  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
  limparModal();
  document.getElementById("modal").classList.add("hidden");
}

/* ============================================================
   🟩 Salvar operação
============================================================ */
document.getElementById("btnConfirmar").addEventListener("click", async () => {

  const responsavel =
    document.getElementById("inputResponsavel").value ||
    usuarioLogado.nome_usuario;

  const observacoes = document.getElementById("inputObs").value || "";

  const body = {
    acao: acaoAtual === "receber" ? "receber" : "retirar",
    id_adocao: adocaoAtual,
    id_ponto: idPonto,
    responsavel,
    observacoes
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

// Iniciar
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
