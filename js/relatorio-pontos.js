// ============================================================
// 📦 VARAL DOS SONHOS — Relatório Pontos de Coleta
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

async function carregarPontos() {
  const tbody = document.getElementById("tabelaPontos");

  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();

    if (!json.sucesso) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Erro ao carregar dados</td></tr>`;
      return;
    }

    pontosOriginais = json.pontos;
    preencherTabela(pontosOriginais);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Erro inesperado</td></tr>`;
  }
}

function preencherTabela(lista) {
  const tbody = document.getElementById("tabelaPontos");
  tbody.innerHTML = "";

  lista.forEach((p, index) => {
    const f = p.fields;

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${f.nome_ponto}</td>
        <td>${f.cidade}</td>
        <td>${f.endereco}</td>
        <td>${f.email_ponto}</td>
        <td>${f.horario_funcionamento}</td>
        <td>${f.responsavel}</td>
        <td>${f.status || "ativo"}</td>
      </tr>`;
  });

  document.getElementById("totalPontos").textContent = lista.length;
}

function filtrar() {
  const cidade = document.getElementById("filtroCidade").value;
  const status = document.getElementById("filtroStatus").value;

  const filtrados = pontosOriginais.filter((p) => {
    const f = p.fields;

    return (
      (cidade === "todos" || f.cidade === cidade) &&
      (status === "todos" || (f.status || "ativo") === status)
    );
  });

  preencherTabela(filtrados);
}
