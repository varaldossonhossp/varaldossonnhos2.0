// ============================================================
// 📦 Importa componentes HTML (header, footer, cloudinho)
// ============================================================
async function carregarComponente(id, arquivo) {
  try {
    const resp = await fetch(arquivo);
    if (!resp.ok) throw new Error(`Erro ao carregar ${arquivo}`);
    const html = await resp.text();
    document.getElementById(id).innerHTML = html;
  } catch (erro) {
    console.error("Erro ao carregar componente:", erro);
  }
}
