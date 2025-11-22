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

// Obtém ponto logado
let usuarioLogado = JSON.parse(localStorage.getItem("usuario_logado"));

if (!usuarioLogado || usuarioLogado.tipo !== "ponto") {
  alert("Acesso negado.");
  window.location.href = "../index.html";
}

const idPonto = usuarioLogado.id_record;

// --------------------------------------------
// Carregar adoções do ponto
// --------------------------------------------
async function carregarAdoacoes() {
  const r = await fetch(API_ADOCOES);
  const json = await r.json();

  if (!json.sucesso) {
    alert("Erro ao carregar adoções.");
    return;
  }

  const lista = json.adocoes.filter(a => a.id_ponto === idPonto);

  preencherSecoes(lista);
}

// --------------------------------------------
// Montagem das listas
// --------------------------------------------
function preencherSecoes(lista) {

  const t1 = document.getElementById("listaReceber");
  const t2 = document.getElementById("listaRetirar");
  const t3 = document.getElementById("listaEntregues");

  t1.innerHTML = t2.innerHTML = t3.innerHTML = "";

  lista.forEach(a => {
    const primeiroNome = a.nome_crianca.split(" ")[0];

    let html = `
      <div class="item">
        <p class="font-bold text-lg">${primeiroNome}</p>
        <p class="text-gray-700">🎁 ${a.sonho}</p>

        <div class="mt-2">
          <span class="tag">👤 ${a.nome_usuario}</span>
          <span class="tag">📍 ${a.endereco_ponto || ""}</span>
          <span class="tag">🆔 Cartinha ${a.id_cartinha}</span>
        </div>
    `;

    if (a.status_adocao === "confirmada") {
      html += `
        <button class="btn-blue mt-4"
          onclick="abrirModal('receber','${a.id_record}')">
          📥 Receber
        </button>
      `;
      html += "</div>";
      t1.innerHTML += html;
    }

    else if (a.status_adocao === "presente recebido") {
      html += `<p class="mt-3 text-green-700 font-semibold">Recebido — aguardando retirada</p></div>`;
      t2.innerHTML += html;
    }

    else if (a.status_adocao === "presente entregue") {
      html += `<p class="mt-3 text-orange-700 font-semibold">Entregue ✔️</p></div>`;
      t3.innerHTML += html;
    }
  });
}

// --------------------------------------------
// Modal
// --------------------------------------------
let acaoAtual = null;
let idAtual = null;

function abrirModal(acao, id) {
  acaoAtual = acao;
  idAtual = id;
  document.getElementById("modalTitulo").innerText =
    acao === "receber" ? "Confirmar Recebimento" : "Confirmar";

  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modal").classList.add("hidden");
}

// --------------------------------------------
// Enviar dados para API
// --------------------------------------------
document.getElementById("btnConfirmar").addEventListener("click", async () => {
  const body = {
    acao: acaoAtual,
    id_adocao: idAtual,
    id_ponto: idPonto,
    responsavel: document.getElementById("inputResponsavel").value || usuarioLogado.nome_usuario,
    observacoes: document.getElementById("inputObs").value,
    foto: document.getElementById("inputFoto").value || ""
  };

  const r = await fetch(API_LOGISTICA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = await r.json();
  alert(json.mensagem);

  fecharModal();
  carregarAdoacoes();
});

// Start
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
