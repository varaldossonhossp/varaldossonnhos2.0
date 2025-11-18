// ============================================================
// 🎉 VARAL DOS SONHOS — Relatório de Eventos
// ------------------------------------------------------------
// Página administrativa para gerar relatórios de eventos:
// • Carrega eventos via /api/admin
// • Filtros dinâmicos: Status, Destaque
// • Geração de PDF via impressão do navegador
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarData();
  carregarEventos();

  document.getElementById("btnFiltrar").addEventListener("click", filtrar);
  document.getElementById("btnPDF").addEventListener("click", () => window.print());
});

function carregarData() {
  document.getElementById("dataAtual").textContent =
    new Date().toLocaleDateString("pt-BR");
}

let eventosOriginais = [];

async function carregarEventos() {
  const tabela = document.getElementById("tabelaEventos");

  try {
    const resp = await fetch("/api/admin?token_admin=varaladmin");
    const json = await resp.json();

    eventosOriginais = json.eventos;
    preencherTabela(eventosOriginais);

  } catch (err) {
    tabela.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Erro ao carregar eventos</td></tr>`;
  }
}

function preencherTabela(lista) {
  const tbody = document.getElementById("tabelaEventos");
  tbody.innerHTML = "";

  lista.forEach((ev, i) => {
    const f = ev.fields;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${f.nome_evento}</td>
        <td>${f.local_evento}</td>
        <td>${f.data_evento || "-"}</td>
        <td>${f.data_limite_recebimento || "-"}</td>
        <td>${f.data_realizacao_evento || "-"}</td>
        <td>${f.destacar_na_homepage ? "Sim" : "Não"}</td>
        <td>${f.status_evento}</td>
      </tr>`;
  });

  document.getElementById("totalEventos").textContent = lista.length;
}

function filtrar() {
  const st = document.getElementById("filtroStatus").value;
  const dest = document.getElementById("filtroDestaque").value;

  const filtrados = eventosOriginais.filter((ev) => {
    const f = ev.fields;

    return (
      (st === "todos" || f.status_evento === st) &&
      (dest === "todos" ||
        (dest === "sim" && f.destacar_na_homepage) ||
        (dest === "nao" && !f.destacar_na_homepage))
    );
  });

  preencherTabela(filtrados);
}
