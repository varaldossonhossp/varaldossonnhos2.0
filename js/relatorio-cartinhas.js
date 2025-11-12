/* ============================================================
   💙 VARAL DOS SONHOS — relatorio-cartinhas.js
   ------------------------------------------------------------
   - Carrega cartinhas de /api/cartinha
   - Popula filtros de eventos (via /api/eventos) e pontos (via /api/pontosdecoleta)
   - Aplica filtros por: evento, ponto (se existir na cartinha), sexo, status
   - Normaliza comparações (lowercase) e tolera lookups (string/array)
   - Mantém layout e UI iguais ao relatório de pontos
   ============================================================ */

const $ = (sel) => document.querySelector(sel);

// Elementos UI
const selEvento   = $("#filtro-evento");
const selPonto    = $("#filtro-ponto");
const selSexo     = $("#filtro-sexo");
const selStatus   = $("#filtro-status");
const btnFiltrar  = $("#btn-filtrar");
const btnImprimir = $("#btn-imprimir");
const totalSpan   = $("#total-registros");
const tbody       = $("#tabela-cartinhas");

// Estado em memória
let CARTINHAS = [];

// Util: transforma string/array/undefined em array de strings normalizadas
function toArrayLower(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(x => String(x).trim().toLowerCase());
  return [String(v).trim().toLowerCase()];
}

// Util: pega campo de ponto de coleta que existir na cartinha
function getPontoFromCartinha(c) {
  // tolera vários nomes e formatos
  const candidatos = [
    c.ponto_coleta,
    c.ponto_de_coleta,
    c.ponto,                     // se usou esse nome
  ];
  // se algum for array/lookup, junta; senão pega primeiro texto que existir
  const normalizados = candidatos
    .flatMap(v => toArrayLower(v))
    .filter(Boolean);

  // retorna array (para poder checar includes)
  return normalizados;
}

// Render da tabela
function renderTabela(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td class="text-center text-gray-500 p-4" colspan="9">
          Nenhuma cartinha encontrada com os filtros selecionados.
        </td>
      </tr>`;
    totalSpan.textContent = 0;
    return;
  }

  const rows = lista.map((c, i) => {
    const img = (Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]?.url)
      ? `<img src="${c.imagem_cartinha[0].url}" alt="cartinha" class="w-10 h-10 object-cover rounded-md border" />`
      : `<span class="text-gray-400">—</span>`;

    return `
      <tr class="border-b last:border-0 hover:bg-blue-50/40">
        <td class="py-2 px-3 text-sm text-gray-600">${i + 1}</td>
        <td class="py-2 px-3">
          <div class="flex items-center gap-3">
            ${img}
            <div>
              <p class="font-semibold text-gray-900">${c.nome_crianca || "—"}</p>
              <p class="text-xs text-gray-500">${c.primeiro_nome || ""}</p>
            </div>
          </div>
        </td>
        <td class="py-2 px-3 text-sm">${c.idade ?? "—"}</td>
        <td class="py-2 px-3 text-sm capitalize">${c.sexo || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.sonho || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.escola || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.cidade || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.nome_evento || "—"}</td>
        <td class="py-2 px-3 text-sm capitalize">
          <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">${c.status || "—"}</span>
        </td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rows;
  totalSpan.textContent = lista.length;
}

// Aplica filtros nos dados em memória
function aplicarFiltros() {
  const fEvento = (selEvento.value || "").trim().toLowerCase();      // nome do evento
  const fPonto  = (selPonto.value  || "").trim().toLowerCase();      // nome do ponto
  const fSexo   = (selSexo.value   || "").trim().toLowerCase();      // menino/menina/outro
  const fStatus = (selStatus.value || "").trim().toLowerCase();      // disponivel/adotada/inativa

  const filtrada = CARTINHAS.filter(c => {
    const sexo   = (c.sexo   || "").trim().toLowerCase();
    const status = (c.status || "").trim().toLowerCase();

    // evento pode vir como string ou array (lookup)
    const eventos = toArrayLower(c.nome_evento);

    // ponto pode nem existir na cartinha; quando existir, tratamos string/array
    const pontos = getPontoFromCartinha(c);

    // Regras de filtro (ignora quando "todos")
    const okEvento = !fEvento || fEvento === "todos" || eventos.includes(fEvento);
    const okPonto  = !fPonto  || fPonto  === "todos" || pontos.includes(fPonto);
    const okSexo   = !fSexo   || fSexo   === "todos" || sexo === fSexo;
    const okStatus = !fStatus || fStatus === "todos" || status === fStatus;

    return okEvento && okPonto && okSexo && okStatus;
  });

  renderTabela(filtrada);
}

// Carrega selects (eventos e pontos) e dados das cartinhas
async function carregarDados() {
  try {
    // 1) Eventos
    const evResp = await fetch("../api/eventos?tipo=all");
    const evData = await evResp.json();
    if (evData?.sucesso && Array.isArray(evData.eventos)) {
      // valor = nome do evento em lowercase (para comparar com lookup `nome_evento`)
      const opts = evData.eventos
        .map(e => `<option value="${(e.nome_evento || "").trim().toLowerCase()}">${e.nome_evento || "—"}</option>`)
        .join("");
      selEvento.insertAdjacentHTML("beforeend", opts);
    }

    // 2) Pontos de coleta
    const ptResp = await fetch("../api/pontosdecoleta");
    const ptData = await ptResp.json();
    if (ptData?.sucesso && Array.isArray(ptData.pontos)) {
      // valor = nome do ponto em lowercase
      const opts = ptData.pontos
        .map(p => `<option value="${(p.nome_ponto || "").trim().toLowerCase()}">${p.nome_ponto || "—"}</option>`)
        .join("");
      selPonto.insertAdjacentHTML("beforeend", opts);
    }

    // 3) Cartinhas
    const ctResp = await fetch("../api/cartinha");
    const ctData = await ctResp.json();
    if (!ctData?.sucesso) throw new Error(ctData?.mensagem || "Falha ao buscar cartinhas");

    CARTINHAS = Array.isArray(ctData.cartinha) ? ctData.cartinha : [];
    // Render inicial (sem filtros)
    renderTabela(CARTINHAS);

  } catch (err) {
    console.error("Erro ao carregar dados do relatório:", err);
    tbody.innerHTML = `
      <tr>
        <td class="text-center text-red-600 p-4" colspan="9">
          Erro ao carregar dados. Verifique sua conexão e tente novamente.
        </td>
      </tr>`;
    totalSpan.textContent = 0;
  }
}

// Imprimir (abre diálogo padrão do navegador — não baixa direto)
function abrirDialogoImpressao() {
  window.print();
}

/* --------- Listeners --------- */
btnFiltrar.addEventListener("click", aplicarFiltros);
btnImprimir.addEventListener("click", abrirDialogoImpressao);

// Também aplique filtro ao trocar selects (UX melhor)
[selEvento, selPonto, selSexo, selStatus].forEach(el => {
  el.addEventListener("change", aplicarFiltros);
});

/* --------- Boot --------- */
document.addEventListener("DOMContentLoaded", carregarDados);
