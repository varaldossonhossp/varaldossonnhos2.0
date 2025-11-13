// ============================================================
// 💙 VARAL DOS SONHOS — Relatório de Cartinhas (Com evento_nome)
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

    // 🔸 Filtros de eventos (usa ID e mostra nome do evento)
    eventosJson.eventos?.forEach((ev) => {
      const opt = document.createElement("option");
      opt.value = ev.id;  // valor = ID do evento
      opt.textContent = ev.fields.nome_evento; // texto = nome
      selEvento.appendChild(opt);
    });

    // 🔸 Filtros de ponto de coleta
    pontosJson.pontos?.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.fields.nome_ponto;
      opt.textContent = p.fields.nome_ponto;
      selPonto.appendChild(opt);
    });

  } catch (err) {
    console.error("Erro ao carregar filtros:", err);
  }
}

// ============================================================
// 🔹 Carregar cartinhas da API
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
// 🔹 Preencher tabela com cartinhas (incluindo EVENTO_NOME)
// ============================================================
function preencherTabela(lista) {
  const tbody = document.getElementById("tabelaBody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 py-4">Nenhuma cartinha encontrada</td></tr>`;
    return;
  }

  lista.forEach((c, index) => {
    const f = c;

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

        <!-- ✔ Campo expandido evento_nome -->
        <td>${f.evento_nome || "-"}</td>

        <td>${f.status || "-"}</td>
      </tr>
    `;
  });

  document.getElementById("totalCartinhas").textContent = lista.length;
}

// ============================================================
// 🔹 Filtrar cartinhas
// ============================================================
function filtrar() {
  const ev = document.getElementById("filtroEvento").value;
  const ponto = document.getElementById("filtroPonto").value;
  const sexo = document.getElementById("filtroSexo").value;
  const status = document.getElementById("filtroStatus").value;

  const filtradas = cartinhasOriginais.filter((c) => {
    const f = c;

    return (
      (ev === "todos" ||
        (Array.isArray(f.id_evento) && f.id_evento.includes(ev))) &&

      (ponto === "todos" || f.ponto_coleta === ponto) &&
      (sexo === "todos" || f.sexo === sexo) &&
      (status === "todos" || f.status === status)
    );
  });

  preencherTabela(filtradas);
}
