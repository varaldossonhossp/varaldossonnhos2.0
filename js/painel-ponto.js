// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js 
// ------------------------------------------------------------
// Painel do Ponto de Coleta:
// • Lista APENAS adoções ligadas ao ponto logado
// • Modal mostra TODAS as observações (movimentos)
// • Modal já carrega a ÚLTIMA observação automaticamente
// • Quando salva → cria novo movimento na tabela ponto_movimentos
// • Interface organizada por status:
//      - confirmada → receber
//      - presente recebido → retirada
//      - presente entregue → finalizado
// ============================================================


const API_ADOCOES = "/api/listAdocoes";
const API_LOGISTICA = "/api/logistica";



// ===============================================
// 1) IDENTIFICAR PONTO LOGADO
// ===============================================
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



// ===============================================
// 2) BUSCAR ADOÇÕES
// ===============================================
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) {
      console.error("Erro API /listAdocoes:", json.mensagem);
      return;
    }

    // Armazena globalmente para acesso do modal
    window.__ADOCOES__ = json.adocoes || [];

    const minhas = (json.adocoes || []).filter(a => a.id_ponto === idPonto);
    renderizar(minhas);

  } catch (e) {
    console.error("Falha ao carregar adoções:", e);
  }
}



// ===============================================
// 3) RENDERIZAÇÃO POR STATUS
// ===============================================
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



// ===============================================
// 4) TEMPLATES
// ===============================================
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



// ===============================================
// 5) OBSERVAÇÕES — MOSTRAR TODAS
// ===============================================
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
      <p class="font-semibold text-blue-700 mb-1">📝 Observações</p>
  `;

  movs.forEach((m, i) => {
    html += `
      <div class="mb-2">
        <p class="text-sm font-semibold text-gray-900">
          Observação ${i + 1} — <span class="text-blue-700">${m.tipo_movimento}</span>
        </p>
        <p class="text-sm text-gray-700">${m.observacoes || "—"}</p>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}



// ============================================================
// 6) MODAL — PREENCHE A ÚLTIMA OBSERVAÇÃO AUTOMATICAMENTE
// ============================================================
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

  // pega os dados completos da adoção
  const ado = window.__ADOCOES__.find(a => a.id_record === idAdo);

  // se existir alguma observação anterior → carrega no modal
  if (ado && ado.movimentos?.length > 0) {
    const ultima = ado.movimentos[ado.movimentos.length - 1];
    document.getElementById("inputObs").value = ultima.observacoes || "";
    document.getElementById("inputResponsavel").value = ultima.responsavel || "";
  }

  document.getElementById("modalTitulo").textContent =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar Retirada";

  document.getElementById("modal").classList.remove("hidden");
}


function fecharModal() {
  limparModal();
  document.getElementById("modal").classList.add("hidden");
}



// ============================================================
// 7) SALVAR OPERAÇÃO (CRIAR NOVO MOVIMENTO NO AIRTABLE)
// ============================================================
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



// ============================================================
// 8) INICIAR
// ============================================================
document.addEventListener("DOMContentLoaded", carregarAdoacoes);

