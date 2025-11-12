/* ============================================================
   💙 VARAL DOS SONHOS — relatorio-cartinhas.js (versão join adoções)
   ------------------------------------------------------------
   - Busca:
       /api/cartinha         → lista de cartinhas
       /api/eventos?tipo=all → para preencher o select de eventos
       /api/pontosdecoleta   → para mapear ID → nome do ponto
       /api/adocoes          → para saber qual ponto está ligado a cada cartinha
   - Faz JOIN em memória: cartinha.id ↔ adocoes.cartinha (linked record)
   - Filtra por: evento, ponto (via adoções), sexo e status
   - Mantém layout do relatório e abre diálogo nativo de impressão
   ============================================================ */

const $ = (sel) => document.querySelector(sel);

// Filtros e UI
const selEvento   = $("#filtroEvento");
const selPonto    = $("#filtroPonto");
const selSexo     = $("#filtroSexo");
const selStatus   = $("#filtroStatus");
const btnFiltrar  = $("#btnFiltrar");
const btnPDF      = $("#btnPDF");
const totalSpan   = $("#totalCartinhas");
const tbody       = $("#tabelaBody");
const dataAtual   = $("#dataAtual");

// Estado
let CARTINHAS = [];           // cartinhas do endpoint
let ADOS_MAP  = new Map();    // Map(cartinhaId → Set([nomes de ponto]))
let PONTOS_ID_TO_NAME = new Map(); // Map(id_ponto → nome_ponto)

// Utils
const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const toLower = (v) => String(v ?? "").trim().toLowerCase();
const toArrayLower = (v) => toArray(v).map(toLower);

// Render da tabela principal
function renderTabela(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-gray-500 py-4">
          Nenhuma cartinha encontrada com os filtros selecionados.
        </td>
      </tr>`;
    totalSpan.textContent = 0;
    return;
  }

  const rows = lista.map((c, idx) => {
    // pega nomes de pontos a partir do join
    const pontosSet = ADOS_MAP.get(c.id) || new Set();
    const pontosTxt = [...pontosSet].join(", ") || "—";

    return `
      <tr class="border-b last:border-0 hover:bg-blue-50/40">
        <td class="py-2 px-3 text-sm text-gray-600">${idx + 1}</td>
        <td class="py-2 px-3">
          <p class="font-semibold text-gray-900">${c.nome_crianca || "—"}</p>
        </td>
        <td class="py-2 px-3 text-sm">${c.idade ?? "—"}</td>
        <td class="py-2 px-3 text-sm capitalize">${c.sexo || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.sonho || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.escola || "—"}</td>
        <td class="py-2 px-3 text-sm">${c.cidade || "—"}</td>
        <td class="py-2 px-3 text-sm">${pontosTxt}</td>
        <td class="py-2 px-3 text-sm">${Array.isArray(c.nome_evento) ? c.nome_evento.join(", ") : (c.nome_evento || "—")}</td>
        <td class="py-2 px-3 text-sm capitalize">
          <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">${c.status || "—"}</span>
        </td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rows;
  totalSpan.textContent = lista.length;
}

// Aplica os filtros
function aplicarFiltros() {
  const fEvento = toLower(selEvento.value);
  const fPonto  = toLower(selPonto.value);
  const fSexo   = toLower(selSexo.value);
  const fStatus = toLower(selStatus.value);

  const filtrada = CARTINHAS.filter((c) => {
    const sexo   = toLower(c.sexo);
    const status = toLower(c.status);

    const eventos = toArrayLower(c.nome_evento); // lookup pode ser array ou string
    const pontosSet = ADOS_MAP.get(c.id) || new Set();
    const pontosLower = [...pontosSet].map(toLower);

    const okEvento = !fEvento || fEvento === "todos" || eventos.includes(fEvento);
    const okPonto  = !fPonto  || fPonto  === "todos" || pontosLower.includes(fPonto);
    const okSexo   = !fSexo   || fSexo   === "todos" || sexo === fSexo;
    const okStatus = !fStatus || fStatus === "todos" || status === fStatus;

    return okEvento && okPonto && okSexo && okStatus;
  });

  renderTabela(filtrada);
}

// Inicia a data
function preencherData() {
  const hoje = new Date();
  dataAtual.textContent = hoje.toLocaleDateString("pt-BR");
}

// Carrega e monta os dados (inclui JOIN)
async function carregarDados() {
  preencherData();

  try {
    // 1) Eventos → popula select com NOME (comparação por texto)
    const ev = await fetch("../api/eventos?tipo=all").then(r => r.json()).catch(()=>({}));
    if (ev?.sucesso && Array.isArray(ev.eventos)) {
      const opts = ev.eventos
        .map(e => `<option value="${toLower(e.nome_evento)}">${e.nome_evento || "—"}</option>`)
        .join("");
      selEvento.insertAdjacentHTML("beforeend", opts);
    }

    // 2) Pontos → além de popular select, montamos Map id → nome
    const pt = await fetch("../api/pontosdecoleta").then(r => r.json()).catch(()=>({}));
    if (pt?.sucesso && Array.isArray(pt.pontos)) {
      // select
      const opts = pt.pontos
        .map(p => `<option value="${toLower(p.nome_ponto)}">${p.nome_ponto || "—"}</option>`)
        .join("");
      selPonto.insertAdjacentHTML("beforeend", opts);

      // map id -> nome
      pt.pontos.forEach(p => {
        if (p.id_ponto) PONTOS_ID_TO_NAME.set(p.id_ponto, p.nome_ponto || "");
      });
    }

    // 3) Cartinhas
    const ct = await fetch("../api/cartinha").then(r => r.json());
    if (!ct?.sucesso) throw new Error(ct?.mensagem || "Falha ao buscar cartinhas");
    CARTINHAS = Array.isArray(ct.cartinha) ? ct.cartinha : [];

    // 4) Adoções → join para descobrir ponto(s) por cartinha
    const ad = await fetch("../api/adocoes").then(r => r.json()).catch(()=>({}));
    const adocoes = (ad?.sucesso && Array.isArray(ad.adocoes)) ? ad.adocoes : [];

    // ADOS_MAP: cartinhaId → Set(nomesPonto)
    ADOS_MAP = new Map();

    adocoes.forEach(a => {
      // cartinhas associadas à adoção (pode vir como string, array de IDs, etc.)
      const cartIds = [
        ...toArray(a.cartinha),
        ...toArray(a.id_cartinha),
        ...toArray(a.cartinha_id),
      ].filter(Boolean);

      // possíveis campos com informação do ponto
      // pode vir como: ID do ponto (rec...), objeto, nome do ponto, array...
      const pontoRaw = [
        ...toArray(a.ponto_coleta),
        ...toArray(a.ponto_de_coleta),
        ...toArray(a.ponto),
        ...toArray(a.ponto_nome),
        ...toArray(a.nome_ponto),
        ...toArray(a.pontos_coleta),
      ].filter(Boolean);

      // converte tudo para nomes legíveis:
      // - se for ID rec... tenta mapear via PONTOS_ID_TO_NAME
      // - se já for string de nome, usa direto
      const nomesPonto = new Set();
      pontoRaw.forEach(v => {
        if (typeof v === "string" && v.startsWith("rec") && PONTOS_ID_TO_NAME.has(v)) {
          nomesPonto.add(PONTOS_ID_TO_NAME.get(v));
        } else if (typeof v === "string") {
          nomesPonto.add(v);
        } else if (v && typeof v === "object") {
          // caso algum endpoint devolva {id:'rec...', nome:'...'}
          const id = v.id || v.id_ponto;
          const nome = v.nome || v.nome_ponto || v.ponto_nome;
          if (id && PONTOS_ID_TO_NAME.has(id)) nomesPonto.add(PONTOS_ID_TO_NAME.get(id));
          if (nome) nomesPonto.add(String(nome));
        }
      });

      // vincula nomes de ponto a cada cartinha dessa adoção
      cartIds.forEach(cid => {
        if (!cid) return;
        const set = ADOS_MAP.get(cid) || new Set();
        nomesPonto.forEach(n => set.add(n));
        ADOS_MAP.set(cid, set);
      });
    });

    // render inicial
    renderTabela(CARTINHAS);

  } catch (e) {
    console.error("Erro ao carregar relatório de cartinhas:", e);
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-red-600 py-4">
          Erro ao carregar dados. Tente novamente.
        </td>
      </tr>`;
    totalSpan.textContent = 0;
  }
}

// Impressão (abre diálogo do navegador — não baixa direto)
function imprimir() {
  window.print();
}

/* ------ Listeners ------ */
btnFiltrar.addEventListener("click", aplicarFiltros);
btnPDF.addEventListener("click", imprimir);

// opcional: filtra ao mudar selects (UX)
[selEvento, selPonto, selSexo, selStatus].forEach(el => {
  el.addEventListener("change", aplicarFiltros);
});

// Boot
document.addEventListener("DOMContentLoaded", carregarDados);
