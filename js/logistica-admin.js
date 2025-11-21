// ============================================================
// 💙 VARAL DOS SONHOS — js/logistica-admin.js (CORRIGIDO)
// ------------------------------------------------------------
// Painel de logística (versão ANTIGA):
// • Lista adoções pendentes
// • Confirmar adoção (status → confirmada)
// • Marcar RECEBIDO
// • Marcar ENTREGUE
// ============================================================

async function carregarAdocoes() {
  try {
    const r = await fetch("/api/adocoes");
    const json = await r.json();

    if (!json.sucesso) throw new Error("Erro ao carregar adoções");

    const lista = json.adocoes.filter(a =>
      ["aguardando confirmacao", "confirmada", "presente recebido"]
        .includes(a.status_adocao)
    );

    const tabela = document.getElementById("tabela-adm");
    tabela.innerHTML = "";

    if (lista.length === 0) {
      tabela.innerHTML = `<tr><td colspan="5" class="p-3 text-center text-gray-500">Nenhuma adoção pendente.</td></tr>`;
      return;
    }

    lista.forEach(a => {
      tabela.innerHTML += `
        <tr>
          <td class="p-2">${a.nome_crianca}</td>
          <td class="p-2">${a.sonho}</td>
          <td class="p-2">${a.nome_doador}</td>
          <td class="p-2">${a.status_adocao}</td>
          <td class="p-2 flex gap-2">

            ${a.status_adocao === "aguardando confirmacao"
              ? `<button onclick="confirmarAdocao('${a.id}')" class="px-3 py-2 bg-blue-600 text-white rounded">Confirmar</button>`
              : ""}

            ${a.status_adocao === "confirmada"
              ? `<button onclick="marcarRecebido('${a.id}')" class="px-3 py-2 bg-green-600 text-white rounded">Recebido</button>`
              : ""}

            ${a.status_adocao === "presente recebido"
              ? `<button onclick="marcarEntregue('${a.id}')" class="px-3 py-2 bg-purple-600 text-white rounded">Entregue</button>`
              : ""}
          
          </td>
        </tr>`;
    });

  } catch (err) {
    alert("Erro ao carregar adoções");
    console.error(err);
  }
}


// ============================================================
// 1️⃣ CONFIRMAR ADOÇÃO (status_adocao → confirmada)
// ============================================================
async function confirmarAdocao(id) {
  const r = await fetch("/api/adocoes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status_adocao: "confirmada" })
  });

  const json = await r.json();

  if (json.sucesso) {
    alert("Adoção confirmada!");
    carregarAdocoes();
  } else {
    alert("Erro ao confirmar.");
  }
}


// ============================================================
// 2️⃣ MARCAR PRESENTE RECEBIDO (chama /api/logistica.js)
// ============================================================
async function marcarRecebido(id_registro) {
  const r = await fetch("/api/logistica", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      acao: "receber",
      id_registro,
      responsavel: "Admin",
      observacoes: ""
    })
  });

  const json = await r.json();

  if (json.sucesso) {
    alert("Presente marcado como RECEBIDO!");
    carregarAdocoes();
  } else {
    alert("Erro: " + json.mensagem);
  }
}

// ============================================================
// 3️⃣ MARCAR PRESENTE ENTREGUE (chama /api/logistica.js)
// ============================================================
async function marcarEntregue(id_registro) {
  const r = await fetch("/api/logistica", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      acao: "coletar",
      id_registro,
      responsavel: "Admin",
      observacoes: ""
    })
  });

  const json = await r.json();

  if (json.sucesso) {
    alert("Presente marcado como ENTREGUE!");
    carregarAdocoes();
  } else {
    alert("Erro: " + json.mensagem);
  }
}


// Inicializar
document.addEventListener("DOMContentLoaded", carregarAdocoes);
