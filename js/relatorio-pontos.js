// ============================================================
// 📦 VARAL DOS SONHOS — Relatório Pontos de Coleta (SEM CIDADE)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarData();
  carregarPontos();

  document.getElementById("btnFiltrar").addEventListener("click", filtrar);
  document.getElementById("btnPDF").addEventListener("click", () => window.print());
});

function carregarData() {
  document.getElementById("dataAtual").textContent =
    new Date().toLocaleDateString("pt-BR");
}

let pontosOriginais = [];

// ============================================================
// 🔵 Carregar Pontos
// ============================================================
async function carregarPontos() {
  const tbody = document.getElementById("tabelaPontos");

  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();

    if (!json.sucesso) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500">Erro ao carregar dados</td></tr>`;
      return;
    }

    pontosOriginais = json.pontos;

    preencherTabela(pontosOriginais);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500">Erro inesperado</td></tr>`;
  }
}

// ============================================================
// 🟣 Preencher Tabela (sem cidade)
// ============================================================
function preencherTabela(lista) {
  const tbody = document.getElementById("tabelaPontos");
  tbody.innerHTML = "";

  lista.forEach((p, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${p.nome_ponto}</td>
        <td>${p.endereco}</td>
        <td>${p.email_ponto}</td>
        <td>${p.horario}</td>
        <td>${p.responsavel}</td>
        <td>${p.status || "ativo"}</td>
      </tr>`;
  });

  document.getElementById("totalPontos").textContent = lista.length;
}

// ============================================================
// 🟢 Filtro — Somente por Status
// ============================================================
function filtrar() {
  const statusFiltro = document.getElementById("filtroStatus").value;

  const filtrados = pontosOriginais.filter((p) => {
    const status = p.status || "ativo";

    return (
      statusFiltro === "todos" || status === statusFiltro
    );
  });

  preencherTabela(filtrados);
}
