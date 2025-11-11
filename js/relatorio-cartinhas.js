/* ============================================================
   💙 VARAL DOS SONHOS — Relatório de Cartinhas
   ------------------------------------------------------------
   - Filtros: evento, ponto, sexo, status
   - Impressão nativa (sem download direto)
  
   ============================================================ */

const tabelaBody = document.getElementById("tabelaBody");
const filtroEvento = document.getElementById("filtroEvento");
const filtroPonto = document.getElementById("filtroPonto");
const filtroSexo = document.getElementById("filtroSexo");
const filtroStatus = document.getElementById("filtroStatus");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnPDF = document.getElementById("btnPDF");
const totalCartinhas = document.getElementById("totalCartinhas");
const dataAtual = document.getElementById("dataAtual");

let cartinhas = [];
let eventos = [];
let pontos = [];

// 📅 Exibe data formatada
dataAtual.textContent = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit", month: "long", year: "numeric"
});

// 🔹 Carregar dados das APIs
async function carregarDados() {
  try {
    const [respCartas, respEventos, respPontos] = await Promise.all([
      fetch("../api/cartinhas"),
      fetch("../api/eventos"),
      fetch("../api/pontosdecoleta")
    ]);

    const [dataCartas, dataEventos, dataPontos] = await Promise.all([
      respCartas.json(),
      respEventos.json(),
      respPontos.json()
    ]);

    if (!dataCartas.sucesso) throw new Error("Erro ao carregar cartinhas");
    if (!dataEventos.sucesso) throw new Error("Erro ao carregar eventos");
    if (!dataPontos.sucesso) throw new Error("Erro ao carregar pontos");

    cartinhas = dataCartas.cartinhas;
    eventos = dataEventos.eventos;
    pontos = dataPontos.pontos;

    preencherFiltros();
    renderizarTabela(cartinhas);
  } catch (err) {
    console.error(err);
    tabelaBody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500 py-4">Erro ao carregar dados.</td></tr>`;
  }
}

// 🔹 Preenche os filtros com dados reais
function preencherFiltros() {
  eventos.forEach(ev => {
    const opt = document.createElement("option");
    opt.value = ev.nome_evento;
    opt.textContent = ev.nome_evento;
    filtroEvento.appendChild(opt);
  });

  pontos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.nome_ponto;
    opt.textContent = p.nome_ponto;
    filtroPonto.appendChild(opt);
  });
}

// 🔹 Renderiza tabela
function renderizarTabela(lista) {
  totalCartinhas.textContent = lista.length;

  if (!lista.length) {
    tabelaBody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-400 py-4">Nenhuma cartinha encontrada.</td></tr>`;
    return;
  }

  tabelaBody.innerHTML = lista.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.nome_crianca || "—"}</td>
      <td>${c.idade || "—"}</td>
      <td>${c.sexo || "—"}</td>
      <td>${c.sonho || "—"}</td>
      <td>${c.escola || "—"}</td>
      <td>${c.cidade || "—"}</td>
      <td>${c.ponto_coleta || "—"}</td>
      <td>${c.evento || "—"}</td>
      <td class="font-semibold ${
        c.status === "adotada" || c.status === "confirmada"
          ? "text-green-600"
          : c.status === "aguardando confirmacao"
          ? "text-yellow-600"
          : c.status === "presente entregue"
          ? "text-blue-600"
          : "text-gray-500"
      }">${c.status || "—"}</td>
    </tr>
  `).join("");
}

// 🔹 Aplicar filtros
btnFiltrar.addEventListener("click", () => {
  const eventoSel = filtroEvento.value;
  const pontoSel = filtroPonto.value;
  const sexoSel = filtroSexo.value;
  const statusSel = filtroStatus.value;

  let filtradas = [...cartinhas];

  if (eventoSel !== "todos") filtradas = filtradas.filter(c => c.evento === eventoSel);
  if (pontoSel !== "todos") filtradas = filtradas.filter(c => c.ponto_coleta === pontoSel);
  if (sexoSel !== "todos") filtradas = filtradas.filter(c => c.sexo === sexoSel);
  if (statusSel !== "todos") filtradas = filtradas.filter(c => c.status === statusSel);

  renderizarTabela(filtradas);
});

// 🔹 Impressão nativa (como relatório de cartinhas por evento)
btnPDF.addEventListener("click", () => {
  window.print();
});

// 🚀 Inicialização
carregarDados();
