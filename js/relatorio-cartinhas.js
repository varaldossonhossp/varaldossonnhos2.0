// ============================================================
// 💙 VARAL DOS SONHOS — Relatório de Cartinhas
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

// 🔹 Carregar filtros de Eventos e Pontos
async function carregarFiltros() {
  try {
    const eventosResp = await fetch("/api/eventos");
    const pontosResp = await fetch("/api/pontosdecoleta");
    const eventosJson = await eventosResp.json();
    const pontosJson = await pontosResp.json();

    const eventoSel = document.getElementById("filtroEvento");
    eventosJson.eventos?.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e.fields.nome_evento;
      opt.textContent = e.fields.nome_evento;
      eventoSel.appendChild(opt);
    });

    const pontoSel = document.getElementById("filtroPonto");
    pontosJson.pontos?.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.fields.nome_ponto;
      opt.textContent = p.fields.nome_ponto;
      pontoSel.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar filtros:", err);
  }
}

// 🔹 Carregar Cartinhas
let cartinhasOriginais = [];

async function carregarCartinhas() {
  const tbody = document.getElementById("tabelaBody");

  try {
    const resp = await fetch("/api/cartinhas");
    const json = await resp.json();

    if (!json.sucesso) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500">Erro ao carregar dados</td></tr>`;
      return;
    }

    cartinhasOriginais = json.cartinhas;
    preencherTabela(cartinhasOriginais);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500">Erro inesperado</td></tr>`;
  }
}

// 🔹 Preencher tabela
function preencherTabela(lista) {
  const tbody = document.getElementById("tabelaBody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 py-4">Nenhuma cartinha encontrada</td></tr>`;
  }

  lista.forEach((c, index) => {
    const f = c.fields;

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${f.nome_crianca || "-"}</td>
        <td>${f.idade || "-"}</td>
        <td>${f.sexo || "-"}</td>
        <td>${f.sonho || "-"}</td>
        <td>${f.escola || "-"}</td>
        <td>${f.cidade || "-"}</td>
        <td>${f.ponto_coleta || "-"}</td>
        <td>${f.evento || "-"}</td>
        <td>${f.status || "-"}</td>
      </tr>
    `;
  });

  document.getElementById("totalCartinhas").textContent = lista.length;
}

// 🔹 Filtrar
function filtrar() {
  const ev = document.getElementById("filtroEvento").value;
  const ponto = document.getElementById("filtroPonto").value;
  const sexo = document.getElementById("filtroSexo").value;
  const status = document.getElementById("filtroStatus").value;

  const filtradas = cartinhasOriginais.filter((c) => {
    const f = c.fields;

    return (
      (ev === "todos" || f.evento === ev) &&
      (ponto === "todos" || f.ponto_coleta === ponto) &&
      (sexo === "todos" || f.sexo === sexo) &&
      (status === "todos" || f.status === status)
    );
  });

  preencherTabela(filtradas);
}
