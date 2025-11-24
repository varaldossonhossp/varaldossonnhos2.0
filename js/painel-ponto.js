// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js (VERSÃO FINAL)
// ------------------------------------------------------------
// Sistema revisado para exibir TODAS as observações do ponto:
//   ✔ Recebimento
//   ✔ Retirada
//   ✔ Ordem cronológica
//   ✔ Histórico completo
//   ✔ Compatível com listAdocoes.js sem alterações
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
   🔵 TEMPLATES DE CARDS
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
        onclick="abrirModal('receber', '${a.id_record}', ${encodeURIComponent(JSON.stringify(a.movimentos))})">
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
        onclick="abrirModal('retirar', '${a.id_record}', ${encodeURIComponent(JSON.stringify(a.movimentos))})">
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
   🟩 BLOCO DE OBSERVAÇÕES — TODAS, ORGANIZADAS
============================================================ */
function blocoObservacoes(movs) {

  if (!movs || movs.length === 0) {
    return `
      <div class="section-block">
        <p class="font-semibold text-blue-700 mb-1">📝 Observações</p>
        <p class="text-gray-600 text-sm">Nenhuma observação registrada.</p>
      </div>
    `;
  }

  let html = `
    <div class="section-block">
      <p class="font-semibold text-blue-700 mb-1">📝 Observações do Ponto</p>
  `;

  movs.forEach((m, i) => {
    html += `
      <div class="mt-2 p-2 border-l-4 border-blue-500 bg-white rounded">
        <p class="text-sm"><strong>${i+1}ª observação:</strong></p>
        <p class="text-gray-700 text-sm">• ${m.observacoes || "—"}</p>
        <p class="text-gray-500 text-xs">(${m.tipo_movimento})</p>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

/* ============================================================
   🔶 MODAL
============================================================ */

let acaoAtual = null;
let adocaoAtual = null;
let movimentosAtuais = [];

function limparModal() {
  document.getElementById("inputResponsavel").value = "";
  document.getElementById("inputObs").value = "";
}

function abrirModal(acao, idAdo, movimentosEncoded) {
  acaoAtual = acao;
  adocaoAtual = idAdo;

  movimentosAtuais = JSON.parse(decodeURIComponent(movimentosEncoded));

  limparModal();

  // Se já existe observação anterior → pré-preencher
  if (movimentosAtuais.length > 0) {
    const ultima = movimentosAtuais[movimentosAtuais.length - 1];
    document.getElementById("inputObs").value = ultima.observacoes || "";
  }

  document.getElementById("modalTitulo").textContent =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar Retirada";

  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
  limparModal();
  document.getElementById("modal").classList.add("hidden");
}

/* ============================================================
   🟩 SALVAR OPERAÇÃO
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
