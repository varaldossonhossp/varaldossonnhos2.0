/* ============================================================
   💙 VARAL DOS SONHOS — Relatório de Cartinhas
   ------------------------------------------------------------
   Função:
   - Gera relatório filtrável das cartinhas cadastradas
   - Realiza join com tabela de adoções (para ponto de coleta)
   - Permite filtros por evento, ponto, sexo e status
   - Gera relatório pronto para impressão (PDF)
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // 🔹 Referências aos elementos HTML
  const tabelaBody = document.getElementById("tabelaBody");
  const totalCartinhas = document.getElementById("totalCartinhas");
  const dataAtual = document.getElementById("dataAtual");
  const btnFiltrar = document.getElementById("btnFiltrar");
  const btnPDF = document.getElementById("btnPDF");
  const selEvento = document.getElementById("filtroEvento");
  const selPonto = document.getElementById("filtroPonto");
  const selSexo = document.getElementById("filtroSexo");
  const selStatus = document.getElementById("filtroStatus");

  // 🔹 Data atual formatada
  dataAtual.textContent = new Date().toLocaleDateString("pt-BR");

  // 🔹 Variáveis globais para armazenar dados
  let CARTINHAS = [];
  let ADOS_MAP = new Map(); // Map: id_cartinha → Set(pontos)
  let EVENTOS = [];
  let PONTOS = [];

  // ============================================================
  // 🧩 Função utilitária: converter para minúsculas com segurança
  // ============================================================
  const toLower = (v) => (v ? v.toString().trim().toLowerCase() : "");
  const toArrayLower = (v) => {
    if (Array.isArray(v)) return v.map(toLower);
    if (typeof v === "string") return [toLower(v)];
    return [];
  };

  // ============================================================
  // 🔹 Carregamento inicial de dados (cartinhas, adoções, eventos, pontos)
  // ============================================================
  async function carregarDados() {
    try {
      const [respCartinhas, respAdocoes, respEventos, respPontos] = await Promise.all([
        fetch("/api/cartinhas"),
        fetch("/api/adocoes"),
        fetch("/api/eventos?tipo=all"),
        fetch("/api/pontosdecoleta"),
      ]);

      const [dataCartinhas, dataAdocoes, dataEventos, dataPontos] = await Promise.all([
        respCartinhas.json(),
        respAdocoes.json(),
        respEventos.json(),
        respPontos.json(),
      ]);

      CARTINHAS = dataCartinhas.cartinhas || [];
      EVENTOS = dataEventos.eventos || [];
      PONTOS = dataPontos.pontos || [];

      // 🔹 Monta mapa: id_cartinha → Set(nomes dos pontos)
      ADOS_MAP = new Map();
      if (Array.isArray(dataAdocoes.adocoes)) {
        for (const a of dataAdocoes.adocoes) {
          const idCart = a.id_cartinha || a.id_cartinha_ref || a.cartinha_id;
          const ponto = a.ponto_coleta || a.nome_ponto || a.ponto;
          if (!idCart || !ponto) continue;
          if (!ADOS_MAP.has(idCart)) ADOS_MAP.set(idCart, new Set());
          ADOS_MAP.get(idCart).add(ponto);
        }
      }

      preencherSelects();
      renderTabela(CARTINHAS);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      tabelaBody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500 py-4">Erro ao carregar dados</td></tr>`;
    }
  }

  // ============================================================
  // 🔹 Preenche os selects de filtros (Evento e Ponto)
  // ============================================================
  function preencherSelects() {
    // Eventos
    EVENTOS.forEach((ev) => {
      const opt = document.createElement("option");
      opt.value = ev.nome_evento;
      opt.textContent = ev.nome_evento;
      selEvento.appendChild(opt);
    });

    // Pontos de Coleta
    PONTOS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.nome_ponto;
      opt.textContent = p.nome_ponto;
      selPonto.appendChild(opt);
    });
  }

  // ============================================================
  // 🔹 Renderiza tabela com dados filtrados
  // ============================================================
  function renderTabela(lista) {
    if (!lista.length) {
      tabelaBody.innerHTML = `<tr><td colspan="10" class="text-center text-gray-400 py-4">Nenhuma cartinha encontrada</td></tr>`;
      totalCartinhas.textContent = "0";
      return;
    }

    tabelaBody.innerHTML = lista
      .map((c, i) => {
        const pontos = [...(ADOS_MAP.get(c.id_cartinha) || [])].join(", ") || "—";
        const evento = Array.isArray(c.nome_evento)
          ? c.nome_evento.join(", ")
          : c.nome_evento || "—";

        return `
          <tr>
            <td>${i + 1}</td>
            <td>${c.nome_crianca || "—"}</td>
            <td>${c.idade || "—"}</td>
            <td>${c.sexo || "—"}</td>
            <td>${c.sonho || "—"}</td>
            <td>${c.escola || "—"}</td>
            <td>${c.cidade || "—"}</td>
            <td>${pontos}</td>
            <td>${evento}</td>
            <td>${c.status || "—"}</td>
          </tr>`;
      })
      .join("");

    totalCartinhas.textContent = lista.length;
  }

  // ============================================================
  // 🔹 Aplica os filtros (Evento, Ponto, Sexo, Status)
  // ============================================================
  function aplicarFiltros() {
    const fEvento = toLower(selEvento.value);
    const fPonto = toLower(selPonto.value);
    const fSexo = toLower(selSexo.value);
    const fStatus = toLower(selStatus.value);

    const filtrada = CARTINHAS.filter((c) => {
      const sexo = toLower(c.sexo);
      const status = toLower(c.status);

      // 🔸 Normaliza o campo de eventos (pode ser string, array ou objeto)
      let eventosLista = [];
      if (Array.isArray(c.nome_evento)) {
        eventosLista = c.nome_evento.map((e) =>
          toLower(typeof e === "string" ? e : e?.nome_evento || e?.fields?.nome_evento || "")
        );
      } else if (typeof c.nome_evento === "string") {
        eventosLista = c.nome_evento.split(",").map(toLower);
      } else if (c?.fields?.nome_evento) {
        eventosLista = [toLower(c.fields.nome_evento)];
      }

      // 🔸 Ponto de coleta via join com adoções
      const pontosSet = ADOS_MAP.get(c.id_cartinha) || new Set();
      const pontosLower = [...pontosSet].map(toLower);

      const okEvento =
        !fEvento || fEvento === "todos" || eventosLista.some((ev) => ev.includes(fEvento));
      const okPonto =
        !fPonto || fPonto === "todos" || pontosLower.includes(fPonto);
      const okSexo =
        !fSexo || fSexo === "todos" || sexo === fSexo;
      const okStatus =
        !fStatus || fStatus === "todos" || status === fStatus;

      return okEvento && okPonto && okSexo && okStatus;
    });

    renderTabela(filtrada);
  }

  // ============================================================
  // 🔹 Botões
  // ============================================================
  btnFiltrar.addEventListener("click", aplicarFiltros);

  btnPDF.addEventListener("click", () => {
    window.print(); // 🖨️ Abre caixa de impressão (permite salvar como PDF)
  });

  // ============================================================
  // 🔹 Inicialização
  // ============================================================
  carregarDados();
});
