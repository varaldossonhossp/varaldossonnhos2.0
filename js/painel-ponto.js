// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js (VERSÃO FINAL 2025)
// ------------------------------------------------------------
// Painel do Ponto de Coleta:
// • Lista APENAS adoções ligadas ao ponto logado
// • Exibe primeiro nome da criança
// • Layout padronizado 
// • Modal para confirmar RECEBIMENTO ou RETIRADA
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
// 🔹 Função para garantir *somente o primeiro nome da criança*
// ------------------------------------------------------------
function nomeCrianca(a) {
  if (a.primeiro_nome && a.primeiro_nome.trim() !== "") {
    return a.primeiro_nome.trim();
  }
  if (a.nome_crianca && a.nome_crianca.includes(" ")) {
    return a.nome_crianca.split(" ")[0].trim();
  }
  return a.nome_crianca || "Criança";
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

// ------------------------------------------------------------
// 🔹 Templates VISUAIS (padronizado igual ao logística-admin)
// ------------------------------------------------------------
function linhaAguardandoRecebimento(a) {
  return `
    <div class="item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-2">
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

function linhaAguardandoRetirada(a) {
  return `
    <div class="item">
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-2">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 Doador: ${a.nome_usuario}</span>
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
      <p class="font-bold text-lg">${nomeCrianca(a)}</p>
      <p class="text-gray-600 text-sm">🎁 ${a.sonho}</p>

      <div class="mt-2">
        <span class="tag">🆔 Cartinha: ${a.id_cartinha}</span>
        <span class="tag">👤 Doador: ${a.nome_usuario}</span>
      </div>

      <span class="tag bg-green-100 text-green-700">✔️ Entregue</span>
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

function fecharModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").classList.remove("flex");
}

// ------------------------------------------------------------
// 5) Enviar operação para API /logistica
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

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
