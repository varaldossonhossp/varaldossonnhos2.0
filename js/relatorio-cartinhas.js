// ============================================================
// 💙 VARAL DOS SONHOS — Relatório de Cartinhas (Versão Completa)
// ------------------------------------------------------------
// Página administrativa para gerar relatórios de cartinhas:
// • Carrega cartinhas via /api/cartinha
// • Filtros dinâmicos: Evento, Sexo, Status, Idade, Escola, Irmãos
// • Geração de PDF via impressão do navegador
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
// 🔹 Carregar Filtros
// ============================================================
async function carregarFiltros() {
  try {
    const eventosResp = await fetch("/api/eventos");
    const eventosJson = await eventosResp.json();

    const selEvento = document.getElementById("filtroEvento");
    const selIdade = document.getElementById("filtroIdade");
    const selEscola = document.getElementById("filtroEscola");

    // EVENTOS
    eventosJson.eventos?.forEach((ev) => {
      if (!ev.fields?.nome_evento) return;
      const opt = document.createElement("option");
      opt.value = ev.fields.nome_evento;
      opt.textContent = ev.fields.nome_evento;
      selEvento.appendChild(opt);
    });

  } catch (err) {
    console.error("Erro ao carregar filtros:", err);
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

    // Preencher select de idade e escola baseado nos dados reais
    preencherFiltrosDinamicos(cartinhasOriginais);

    preencherTabela(cartinhasOriginais);

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500">Erro inesperado</td></tr>`;
  }
}

// ============================================================
// 🔹 Preencher filtros idade/escola dinamicamente
// ============================================================
function preencherFiltrosDinamicos(lista) {
  const selIdade = document.getElementById("filtroIdade");
  const selEscola = document.getElementById("filtroEscola");

  const idades = [...new Set(lista.map(f => f.idade).filter(Boolean))].sort((a, b) => a - b);
  const escolas = [...new Set(lista.map(f => f.escola).filter(Boolean))].sort();

  idades.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selIdade.appendChild(opt);
  });

  escolas.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e;
    selEscola.appendChild(opt);
  });
}

// ============================================================
// 🔹 Preencher Tabela
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
        <td>${f.evento_nome || "-"}</td>
        <td>${f.status || "-"}</td>
        <td>${f.irmaos ?? "-"}</td>
      </tr>
    `;
  });

  document.getElementById("totalCartinhas").textContent = lista.length;
}

// ============================================================
// 🔹 FILTRAR (com todos os filtros)
// ============================================================
function filtrar() {
  const filtroEvento = document.getElementById("filtroEvento").value;
  const filtroSexo = document.getElementById("filtroSexo").value;
  const filtroStatus = document.getElementById("filtroStatus").value;
  const filtroIdade = document.getElementById("filtroIdade").value;
  const filtroEscola = document.getElementById("filtroEscola").value;
  const filtroIrmao = document.getElementById("filtroIrmao").value;

  const filtradas = cartinhasOriginais.filter((f) => {

    const eventoOK =
      filtroEvento === "todos" ||
      f.evento_nome?.toLowerCase() === filtroEvento.toLowerCase();

    const sexoOK =
      filtroSexo === "todos" ||
      f.sexo?.toLowerCase() === filtroSexo.toLowerCase();

    const statusOK =
      filtroStatus === "todos" ||
      f.status?.toLowerCase() === filtroStatus.toLowerCase();

    const idadeOK =
      filtroIdade === "todos" ||
      Number(f.idade) === Number(filtroIdade);

    const escolaOK =
      filtroEscola === "todos" ||
      f.escola?.toLowerCase() === filtroEscola.toLowerCase();

    const irmaoOK =
      filtroIrmao === "todos" ||
      (filtroIrmao === "sim" && Number(f.irmaos) > 0) ||
      (filtroIrmao === "nao" && Number(f.irmaos) === 0);

    return eventoOK && sexoOK && statusOK && idadeOK && escolaOK && irmaoOK;
  });

  preencherTabela(filtradas);
}
