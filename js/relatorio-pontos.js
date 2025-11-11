/* ============================================================
   💙 VARAL DOS SONHOS — Relatório de Pontos de Coleta
   ------------------------------------------------------------
   - Consulta simples via API pontosdecoleta
   - Filtro por status ativo/inativo/todos
   - Geração de PDF via jsPDF
   ============================================================ */

const tabelaBody = document.getElementById("tabelaBody");
const filtroStatus = document.getElementById("filtroStatus");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnPDF = document.getElementById("btnPDF");

let pontos = [];

// ============================================================
// 🔹 Buscar dados da API
// ============================================================
async function carregarPontos() {
  try {
    const resp = await fetch("../api/pontosdecoleta");
    const data = await resp.json();
    if (!data.sucesso) throw new Error("Erro ao carregar pontos");
    pontos = data.pontos;
    renderizarTabela(pontos);
  } catch (erro) {
    console.error(erro);
    tabelaBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-4">Erro ao carregar pontos.</td></tr>`;
  }
}

// ============================================================
// 🔹 Renderizar tabela com filtro
// ============================================================
function renderizarTabela(lista) {
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

// ============================================================
// 🔹 Aplicar filtro por status
// ============================================================
btnFiltrar.addEventListener("click", () => {
  const status = filtroStatus.value;
  const filtrados = status === "todos" ? pontos : pontos.filter(p => p.status === status);
  renderizarTabela(filtrados);
});

// ============================================================
// 🔹 Gerar PDF com jsPDF
// ============================================================
btnPDF.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("📋 Relatório de Pontos de Coleta — Varal dos Sonhos", 15, 20);
  doc.setFontSize(11);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 15, 28);

  const status = filtroStatus.value === "todos" ? "Todos" : filtroStatus.value.toUpperCase();
  doc.text(`Filtro aplicado: ${status}`, 15, 36);

  doc.setFontSize(10);
  let y = 48;
  const espacamento = 8;

  const lista = filtroStatus.value === "todos" ? pontos : pontos.filter(p => p.status === filtroStatus.value);

  if (!lista.length) {
    doc.text("Nenhum ponto de coleta encontrado para este filtro.", 15, y);
  } else {
    lista.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.nome_ponto || "—"} (${p.status})`, 15, y);
      y += 5;
      doc.text(`   Responsável: ${p.responsavel || "—"}`, 15, y);
      y += 5;
      doc.text(`   Endereço: ${p.endereco || "—"}`, 15, y);
      y += 5;
      doc.text(`   Telefone: ${p.telefone || "—"}`, 15, y);
      y += espacamento;

      if (y > 270) {  // quebra automática de página
        doc.addPage();
        y = 20;
      }
    });
  }

  doc.save("Relatorio_Pontos_de_Coleta.pdf");
});

// ============================================================
// 🚀 Inicializar
// ============================================================
carregarPontos();
