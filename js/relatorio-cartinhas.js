/* ============================================================
   💙 VARAL DOS SONHOS — Relatório de Cartinhas
   ------------------------------------------------------------
   - Campos ajustados conforme estrutura Airtable real
   - Filtros: nome_evento, nome_ponto, sexo, status
   - Impressão via janela nativa (window.print)
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

// 📅 Exibir data atual
dataAtual.textContent = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric"
});

// 🔹 Carregar dados
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
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
    tabelaBody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500 py-4">Erro ao carregar dados.</td></tr>`;
  }
}

// 🔹 Preencher filtros dinâmicos
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

// 🔹 Renderizar tabela
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
      <td>${c.nome_evento || c.nome_evento_lookup || "—"}</td>
      <td class="font-semibold ${
        c.status === "adotada"
          ? "text-green-600"
          : c.status === "disponivel"
          ? "text-blue-600"
          : "text-gray-500"
      }">${c.status || "—"}</td>
    </tr>
  `).join("");
}

// 🔹 Filtrar registros
btnFiltrar.addEventListener("click", () => {
  const eventoSel = filtroEvento.value;
  const pontoSel = filtroPonto.value;
  const sexoSel = filtroSexo.value;
  const statusSel = filtroStatus.value;

  let filtradas = [...cartinhas];

  if (eventoSel !== "todos") filtradas = filtradas.filter(c => c.nome_evento === eventoSel || c.nome_evento_lookup === eventoSel);
  if (pontoSel !== "todos") filtradas = filtradas.filter(c => c.ponto_coleta === pontoSel);
  if (sexoSel !== "todos") filtradas = filtradas.filter(c => (c.sexo || "").toLowerCase() === sexoSel);
  if (statusSel !== "todos") filtradas = filtradas.filter(c => (c.status || "").toLowerCase() === statusSel);

  renderizarTabela(filtradas);
});

// 🔹 Impressão (abre janela padrão do navegador)
btnPDF.addEventListener("click", () => {
  window.print();
});

// 🚀 Inicializar
carregarDados();
