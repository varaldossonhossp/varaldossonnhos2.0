// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js (VERSÃO FINAL 2025)
// ------------------------------------------------------------
// Painel do Ponto de Coleta:
// • Lista APENAS adoções ligadas ao ponto logado
// • Exibe primeiro nome da criança
// • Layout padronizado 
// • Modal para confirmar RECEBIMENTO ou RETIRADA
// • Integra com /api/logistica.js
// ✔ Exibe responsavel + observações + data da movimentação
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
// Só primeiro nome da criança
// ------------------------------------------------------------
function nomeCrianca(a) {
  if (a.primeiro_nome && a.primeiro_nome.trim() !== "") {
    return a.primeiro_nome.trim();
  }
  if (a.nome_crianca && a.nome_crianca.includes(" ")) {
    return a.nome_crianca.split(" ")[0];
  }
  return a.nome_crianca || "Criança";
}

// Formatar data
function formatarData(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR");
}

// ------------------------------------------------------------
// 2) Carregar adoções
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
// 3) Processar adoções
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
        tReceber.innerHTML += linhaReceber(a);
      } else if (a.status_adocao === "presente recebido") {
        tRetirar.innerHTML += linhaRetirar(a);
      } else if (a.status_adocao === "presente entregue") {
        tEntregues.innerHTML += linhaEntregue(a);
      }
    });
}

// ------------------------------------------------------------
// Templates com layout avançado
// ------------------------------------------------------------
function linhaReceber(a) {
  return `
    <div class="item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-3">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 Doador: ${a.nome_usuario}</span>
      </div>

      <button class="btn-blue mt-4"
        onclick="abrirModal('receber', '${a.id_record}')">
        📥 Confirmar Recebimento
      </button>
    </div>
  `;
}

function linhaRetirar(a) {
  return `
    <div class="item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-3">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 Doador: ${a.nome_usuario}</span>
      </div>

      <!-- Informações DO RECEBIMENTO -->
      <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p class="font-semibold text-blue-800">📥 Recebido pelo ponto</p>
        <p class="text-sm text-gray-700">Responsável: <b>${a.responsavel_recebimento || "—"}</b></p>
        <p class="text-sm text-gray-700">Obs: ${a.obs_recebimento || "—"}</p>
        <p class="text-sm text-gray-700">Data: ${formatarData(a.data_recebimento) || "—"}</p>
      </div>

      <button class="btn-blue mt-4"
        onclick="abrirModal('retirar', '${a.id_record}')">
        📦 Registrar Retirada
      </button>
    </div>
  `;
}

function linhaEntregue(a) {
  return `
    <div class="item">

      <div class="flex justify-between items-center">
        <p class="font-bold text-lg">${nomeCrianca(a)}</p>
        <span class="tag bg-green-200 text-green-900 font-bold">✔ ENTREGUE</span>
      </div>

      <p class="text-gray-600 text-sm mb-3">🎁 ${a.sonho}</p>

      <span class="tag">👤 Doador: ${a.nome_usuario}</span>

      <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p class="font-semibold text-blue-800">📥 Recebido no ponto</p>
        <p class="text-sm text-gray-700">Responsável: <b>${a.resp_recebimento || "—"}</b></p>
        <p class="text-sm text-gray-700">Obs: ${a.obs_recebimento || "—"}</p>
        <p class="text-sm text-gray-700">Data: ${formatarData(a.data_recebimento) || "—"}</p>
      </div>

      <div class="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <p class="font-semibold text-green-800">🚚 Retirada pela equipe</p>
        <p class="text-sm text-gray-700">Responsável: <b>${a.resp_retirada || "—"}</b></p>
        <p class="text-sm text-gray-700">Obs: ${a.obs_retirada || "—"}</p>
        <p class="text-sm text-gray-700">Data: ${formatarData(a.data_retirada) || "—"}</p>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// 4) MODAL
// ------------------------------------------------------------
let acaoAtual = null;
let adocaoAtual = null;

function abrirModal(acao, idAdo) {
  acaoAtual = acao;
  adocaoAtual = idAdo;

  document.getElementById("modalTitulo").textContent =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar Retirada";

  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal").classList.add("flex");
}

function limparModal() {
  document.getElementById("inputResponsavel").value = "";
  document.getElementById("inputObs").value = "";
  document.getElementById("inputFoto").value = "";
}

function fecharModal() {
  limparModal();
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").classList.remove("flex");
}

// ------------------------------------------------------------
// 5) Enviar operação
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
