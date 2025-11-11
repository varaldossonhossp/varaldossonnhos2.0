/* ============================================================
   💙 VARAL DOS SONHOS — Relatório de Pontos de Coleta (PDF)
   ------------------------------------------------------------
   - Consulta pontos via API
   - Filtro por status ativo/inativo/todos
   - Geração de PDF visual fiel (html2canvas + jsPDF)
   ============================================================ */

const tabelaBody = document.getElementById("tabelaBody");
const filtroStatus = document.getElementById("filtroStatus");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnPDF = document.getElementById("btnPDF");
const totalPontos = document.getElementById("totalPontos");
const dataAtual = document.getElementById("dataAtual");

let pontos = [];

// ===============================
// 📅 Exibe a data atual formatada
// ===============================
dataAtual.textContent = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit", month: "long", year: "numeric"
});

// ===============================
// 🔹 Carrega pontos da API
// ===============================
async function carregarPontos() {
  try {
    const resp = await fetch("../api/pontosdecoleta");
    const data = await resp.json();
    if (!data.sucesso) throw new Error("Erro ao carregar pontos");
    pontos = data.pontos;
    renderizarTabela(pontos);
  } catch (err) {
    console.error(err);
    tabelaBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-4">Erro ao carregar pontos.</td></tr>`;
  }
}

// ===============================
// 🔹 Renderiza a tabela
// ===============================
function renderizarTabela(lista) {
  totalPontos.textContent = lista.length;

  if (!lista.length) {
    tabelaBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-4">Nenhum ponto encontrado.</td></tr>`;
    return;
  }

  tabelaBody.innerHTML = lista.map(p => `
    <tr>
      <td>${p.nome_ponto || "—"}</td>
      <td>${p.responsavel || "—"}</td>
      <td>${p.endereco || "—"}</td>
      <td>${p.telefone || "—"}</td>
      <td class="font-semibold ${p.status === "ativo" ? "text-green-600" : "text-gray-500"}">${p.status || "—"}</td>
    </tr>
  `).join("");
}

// ===============================
// 🔹 Filtrar tabela
// ===============================
btnFiltrar.addEventListener("click", () => {
  const status = filtroStatus.value;
  const filtrados = status === "todos" ? pontos : pontos.filter(p => p.status === status);
  renderizarTabela(filtrados);
});

// ===============================
// 🔹 Gerar PDF fiel (com cabeçalho)
// ===============================
btnPDF.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const relatorio = document.getElementById("relatorio");

  // Tira uma captura visual da área do relatório
  const canvas = await html2canvas(relatorio, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();

  // Ajusta proporção da imagem
  const proporcao = canvas.width / canvas.height;
  const largura = larguraPagina - 20;
  const altura = largura / proporcao;

  pdf.addImage(imgData, "PNG", 10, 10, largura, altura);

  pdf.save(`Relatorio_Pontos_de_Coleta_${new Date().toLocaleDateString("pt-BR")}.pdf`);
});

// ===============================
// 🚀 Inicialização
// ===============================
carregarPontos();
