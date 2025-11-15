// ============================================================
// 💙 VARAL DOS SONHOS — painel-ponto.js (FINAL CORRIGIDO)
// Painel do ponto de coleta → conecta API de adoções + logística
// NÃO QUEBRA NENHUMA OUTRA PÁGINA
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

// Corrige ID do ponto (compatível com todas versões)
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
// 2) Buscar adoções
// ------------------------------------------------------------
async function carregarAdoacoes() {
  try {
    const r = await fetch(API_ADOCOES);
    const json = await r.json();

    if (!json.sucesso) {
      console.error("API /adocoes retornou erro:", json.mensagem);
      return;
    }

    processarAdoacoes(json.adocoes || []);

  } catch (e) {
    console.error("Erro ao carregar adoções:", e);
  }
}

// ------------------------------------------------------------
// 3) Classificar adoções e preencher tabela
// ------------------------------------------------------------
function processarAdoacoes(lista) {
  const tReceber = document.getElementById("listaReceber");
  const tRetirar = document.getElementById("listaRetirar");
  const tEntregues = document.getElementById("listaEntregues");

  tReceber.innerHTML = "";
  tRetirar.innerHTML = "";
  tEntregues.innerHTML = "";

  lista
    .filter(a => a.id_ponto === idPonto) // mostra só do ponto logado
    .forEach(a => {

      // Linha padrão da tabela
      const linha = `
        <tr>
          <td>${a.nome_crianca}</td>
          <td>${a.sonho}</td>
          <td>${a.nome_doador}</td>
          <td>${gerarBotao(a)}</td>
        </tr>
      `;

      switch (a.status_adocao) {

        case "confirmada":
          tReceber.innerHTML += linha;
          break;

        case "presente recebido":
          tRetirar.innerHTML += linha;
          break;

        case "presente entregue":
          tEntregues.innerHTML += `
            <tr>
              <td>${a.nome_crianca}</td>
              <td>${a.sonho}</td>
              <td>${a.nome_doador}</td>
              <td>✔️ Entregue</td>
            </tr>
          `;
          break;

        default:
          // Não exibir "aguardando confirmacao"
          break;
      }
    });
}

// ------------------------------------------------------------
// 4) Botões de ação
// ------------------------------------------------------------
function gerarBotao(ado) {
  if (ado.status_adocao === "confirmada") {
    return `
      <button class="btn-acao btn-receber"
        onclick="receber('${ado.id_record}')">📥 Receber</button>`;
  }

  if (ado.status_adocao === "presente recebido") {
    return `
      <button class="btn-acao btn-retirar"
        onclick="retirar('${ado.id_record}')">📦 Registrar Retirada</button>`;
  }

  return "";
}

// ------------------------------------------------------------
// 5) Registrar RECEBIMENTO
// ------------------------------------------------------------
async function receber(idAdocao) {

  const body = {
    acao: "receber",
    id_adocao: idAdocao,
    id_ponto: idPonto,
    responsavel: usuarioLogado.nome || usuarioLogado.nome_usuario,
    observacoes: "",
    foto: ""
  };

  try {
    const r = await fetch(API_LOGISTICA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await r.json();
    alert(json.mensagem);
    carregarAdoacoes();

  } catch (e) {
    alert("Erro ao registrar recebimento.");
    console.error(e);
  }
}

// ------------------------------------------------------------
// 6) Registrar RETIRADA
// ------------------------------------------------------------
async function retirar(idAdocao) {

  const body = {
    acao: "retirar",
    id_adocao: idAdocao,
    id_ponto: idPonto,
    responsavel: usuarioLogado.nome || usuarioLogado.nome_usuario,
    observacoes: "",
    foto: ""
  };

  try {
    const r = await fetch(API_LOGISTICA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await r.json();
    alert(json.mensagem);
    carregarAdoacoes();

  } catch (e) {
    alert("Erro ao registrar retirada.");
    console.error(e);
  }
}

// ------------------------------------------------------------
// 7) Iniciar painel
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", carregarAdoacoes);
