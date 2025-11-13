// ============================================================
// 💙 VARAL DOS SONHOS — Relatório de Cartinhas (Versão Final)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarData();
  carregarFiltros();
  carregarCartinhas();

  document.getElementById("btnFiltrar").addEventListener("click", filtrar);
  document.getElementById("btnPDF").addEventListener("click", () => window.print());
});

// 🔹 Data atual
function carregarData() {
  document.getElementById("dataAtual").textContent =
    new Date().toLocaleDateString("pt-BR");
}

// ============================================================
// 🔹 Filtros
// ============================================================
async function carregarFiltros() {
  try {
    const eventosResp = await fetch("/api/eventos");
    const pontosResp = await fetch("/api/pontosdecoleta");

    const eventosJson = await eventosResp.json();
    const pontosJson = await pontosResp.json();

    const selEvento = document.getElementById("filtroEvento");
    const selPonto = document.getElementById("filtroPonto");

    // EVENTOS
    eventosJson.eventos?.forEach((ev) => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = ev.fields.nome_evento;
      selEvento.appendChild(opt);
    });

    // PONTOS DE COLETA
    pontosJson.pontos?.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.fields.nome_ponto;
      opt.textContent = p.fields.nome_ponto;
      selPonto.appendChild(opt);
    });

  } catch (err) {
    console.error("Erro filtros:", err);
  }
}

// ============================================================
// 🔹 Carregar Cartinhas
// ============================================================
let cartinhasOriginais = [];

async function carregarCartinhas() {
  const tbody = document.getElementById("tabelaBody");

  try {
    const resp = await fetch("/api/cartinha");
    const json = await resp.json();

    if (!json.sucesso) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500">Erro ao carregar dados</td></tr>`;
      return;
    }

    cartinhasOriginais = json.cartinha;
    preencherTabela(cartinhasOriginais);

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500">Erro inesperado</td></tr>`;
  }
}

// ============================================================
// 🔹 Preencher Tabela (EVENTO + PONTO OK)
// ============================================================
function preencherTabela(lista) {
  const tbody = document.getElementById("tabelaBody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 py-4">Nenhuma cartinha encontrada</td></tr>`;
    return;
  }

  lista.forEach((f, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${f.nome_crianca || "-"}</td>
        <td>${f.idade || "-"}</td>
        <td>${f.sexo || "-"}</td>
        <td>${f.sonho || "-"}</td>
        <td>${f.escola || "-"}</td>
        <td>${f.cidade || "-"}</td>

        <!-- Nome correto do ponto de coleta -->
        <td>${f.nome_ponto || "-"}</td>

        <!-- Nome do evento -->
        <td>${f.nome_evento || "-"}</td>

        <td>${f.status || "-"}</td>
      </tr>
    `;
  });

  document.getElementById("totalCartinhas").textContent = lista.length;
}

// ============================================================
// 🔹 Filtrar
// ============================================================
function filtrar() {
  const ev = document.getElementById("filtroEvento").value;
  const ponto = document.getElementById("filtroPonto").value;
  const sexo = document.getElementById("filtroSexo").value;
  const status = document.getElementById("filtroStatus").value;

  const filtradas = cartinhasOriginais.filter((f) => {

    // Filtro por evento
    const eventoOK =
      ev === "todos" || f.id_evento?.includes(ev);

    // Filtro por ponto (usando nome_ponto)
    const pontoOK =
      ponto === "todos" || f.nome_ponto === ponto;

    return (
      eventoOK &&
      pontoOK &&
      (sexo === "todos" || f.sexo === sexo) &&
      (status === "todos" || f.status === status)
    );
  });

  preencherTabela(filtradas);
}
