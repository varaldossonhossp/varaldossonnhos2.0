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
//   ✔ histórico REAL do ponto:
//        responsável / observações / data / foto / tipo
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
// 2) Buscar adoções da API
// ---------------------------------------------
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) {
      console.error("Erro API /listAdocoes:", json.mensagem);
      return;
    }

    const lista = json.adocoes || [];

    const minhas = lista.filter(a => a.id_ponto === idPonto);

    renderizar(minhas);

  } catch (e) {
    console.error("Falha ao carregar adoções:", e);
  }
}

// ---------------------------------------------
// 3) Construir interface completa
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
   🔵 4) Templates dos cards
============================================================ */

function cardReceber(a) {
  return `
  <div class="ado-item">
    <p class="font-bold text-xl">${a.nome_crianca}</p>
    <p class="text-gray-700 mb-2">🎁 ${a.sonho}</p>

    <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
    <span class="tag">👤 Doador: ${a.nome_usuario}</span>

    ${blocoMovimentos(a.movimentos)}

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

    ${blocoMovimentos(a.movimentos)}

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

    ${blocoMovimentos(a.movimentos)}
  </div>
  `;
}

/* ============================================================
   🟦 bloco de movimentos
============================================================ */
function blocoMovimentos(movs) {
  if (!movs || movs.length === 0) {
    return `
    <div class="section-block">
      <p class="font-semibold text-blue-700 mb-1">📄 Movimentos</p>
      <p class="text-gray-600 text-sm">Nenhuma movimentação registrada.</p>
    </div>`;
  }

  let html = `
  <div class="section-block">
    <p class="font-semibold text-blue-700 mb-2">📄 Movimentações</p>
  `;

  movs.forEach(m => {
    html += `
      <div class="mb-3">
        <p><b>Tipo:</b> ${m.tipo_movimento}</p>
        <p><b>Responsável:</b> ${m.responsavel || "—"}</p>
        <p><b>Obs:</b> ${m.observacoes || "—"}</p>
        <p><b>Data:</b> ${m.data_movimento || "—"}</p>
        ${m.foto_presente ? `<img src="${m.foto_presente}" class="mt-2 w-24 rounded border"/>` : ""}
      </div>
      <hr class="my-3">
    `;
  });

  html += `</div>`;
  return html;
}

/* ============================================================
   🔶 Modal
============================================================ */

let acaoAtual = null;
let adocaoAtual = null;

function abrirModal(acao, idAdo) {
  acaoAtual = acao;
  adocaoAtual = idAdo;

  document.getElementById("modalTitulo").textContent =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar Retirada";

  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
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
  const foto = document.getElementById("inputFoto").value || "";

  const body = {
    acao: acaoAtual === "receber" ? "receber" : "retirar",
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

    // limpa campos ao fechar
    document.getElementById("inputResponsavel").value = "";
    document.getElementById("inputObs").value = "";
    document.getElementById("inputFoto").value = "";

    fecharModal();
    carregarAdoacoes();

  } catch (e) {
    alert("Erro ao registrar operação.");
    console.error(e);
  }
});

// ===============================================
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
