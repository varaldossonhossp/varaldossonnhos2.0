// ============================================================
// 💌 VARAL DOS SONHOS — Gerenciar Cartinhas (versão TCC final)
// ------------------------------------------------------------
// 🔹 Correção: Vinculação com tabela "eventos"
// ✅ CORREÇÃO: Reintrodução de evento_id no FormData para POST/PATCH
// ============================================================

(() => {
  const API_URL = "../api/cartinha";
  const API_EVENTOS = "../api/eventos";
  const CLOUD_NAME = "drnn5zmxi";
  const UPLOAD_PRESET = "unsigned_uploads";

  const listaCartinhasBody = document.querySelector("#lista-cartinhas-body");
  const totalCartinhasSpan = document.querySelector("#total-cartinhas");
  const form = document.querySelector("#form-cartinha");
  const previewImagem = document.querySelector("#preview-imagem");
  const selectEvento = document.querySelector("#evento");
  const inputDataEvento = document.querySelector("#data_evento");
  const inputDataLimite = document.querySelector("#data_limite_recebimento");

  let editandoId = null;
  let uploadedUrl = "";
  let eventoAtual = "";

  // ============================================================
  // 🔹 Carregar eventos "em andamento"
  // ============================================================
  async function carregarEventos() {
    try {
      const resp = await fetch(`${API_EVENTOS}?tipo=admin`);
      const data = await resp.json();
      const eventos = data.eventos?.filter(e => e.status_evento === "em andamento") || [];

      if (eventos.length === 0) {
        selectEvento.innerHTML = `<option value="">Nenhum evento ativo</option>`;
        return;
      }

      selectEvento.innerHTML = `<option value="">Selecione um evento</option>`;
      eventos.forEach(ev => {
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.textContent = ev.nome_evento;
        opt.dataset.dataEvento = ev.data_evento;
        opt.dataset.dataLimite = ev.data_limite_recebimento;
        selectEvento.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    }
  }

  selectEvento.addEventListener("change", (e) => {
    const opt = e.target.selectedOptions[0];
    if (!opt) return;
    inputDataEvento.value = opt.dataset.dataEvento || "";
    inputDataLimite.value = opt.dataset.dataLimite || "";
    eventoAtual = opt.value;
    carregarCartinhas(); // 🔁 Filtra cartinhas do evento selecionado
  });

  // ============================================================
  // 🔹 Upload Cloudinary — sem alterações
  // ============================================================
  form.imagem_cartinha.addEventListener("change", async () => {
    const file = form.imagem_cartinha.files[0];
    if (!file) return (previewImagem.innerHTML = "");

    previewImagem.innerHTML = `<p class="text-blue-600">⏳ Enviando imagem...</p>`;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `<img src="${uploadedUrl}" alt="Prévia" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`;
      } else previewImagem.innerHTML = `<p class="text-red-500">❌ Falha no upload.</p>`;
    } catch (err) {
      previewImagem.innerHTML = `<p class="text-red-500">Erro ao enviar imagem.</p>`;
    }
  });

  // ============================================================
  // 🔹 Enviar formulário — adiciona nome_evento e datas
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!eventoAtual) return alert("Selecione um evento antes de cadastrar!");

    const formData = new FormData(form);
    formData.append("imagem_cartinha", uploadedUrl ? JSON.stringify([{ url: uploadedUrl }]) : JSON.stringify([]));
    formData.append("nome_evento", selectEvento.selectedOptions[0].text);
    
    // ✅ O ID do evento (que é o Linked Record)
    formData.append("data_evento", eventoAtual); 
    // ✅ O ID do evento (usado para checagem no POST/PATCH)
    formData.append("evento_id", eventoAtual); 
    
    try {
      const metodo = editandoId ? "PATCH" : "POST";
      const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;
      const resp = await fetch(url, { method: metodo, body: formData });
      const resultado = await resp.json();

      if (resultado.sucesso) {
        alert(editandoId ? "Cartinha atualizada!" : "Cartinha cadastrada!");
        form.reset();
        previewImagem.innerHTML = "";
        uploadedUrl = "";
        editandoId = null;
        carregarCartinhas();
      } else alert("Erro: " + resultado.mensagem);
    } catch (err) {
      alert("Erro ao salvar cartinha.");
    }
  });

  // ============================================================
  // 🔹 Carregar cartinhas filtradas por evento
  // ============================================================
  async function carregarCartinhas() {
    if (!eventoAtual) {
      listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Selecione um evento.</p>`;
      return;
    }

    listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Carregando...</p>`;
    totalCartinhasSpan.textContent = "0";

    try {
      const resp = await fetch(`${API_URL}?evento=${eventoAtual}`);
      const dados = await resp.json();
      const cartinhas = dados.cartinha || [];

      if (!dados.sucesso || cartinhas.length === 0) {
        listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Nenhuma cartinha neste evento.</p>`;
        return;
      }

      totalCartinhasSpan.textContent = cartinhas.length;
      listaCartinhasBody.innerHTML = "";

      cartinhas.forEach((c) => {
        const imgUrl = Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0] ? c.imagem_cartinha[0].url : "../imagens/cartinha-padrao.png";
        const card = document.createElement("div");
        card.className = "p-4 border border-blue-200 rounded-xl shadow-md bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center";

        card.innerHTML = `
          <div class="flex items-center gap-4 w-full lg:w-3/4">
            <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-full border-2 border-blue-400">
            <div class="flex-1">
              <p class="text-lg font-semibold text-gray-800">${c.nome_crianca} (${c.idade} anos, ${c.sexo})</p>
              <p class="text-sm text-gray-600 truncate">🎁 ${c.sonho}</p>
              <p class="text-xs text-gray-500 mt-1">🏫 ${c.escola} — ${c.cidade}</p>
              <p class="text-xs text-gray-500">👩‍🏫 ${c.psicologa_responsavel}</p>
            </div>
          </div>
          <div class="flex flex-col space-y-2 lg:w-1/4 lg:text-right w-full mt-4 lg:mt-0">
            <span class="text-xs font-medium px-3 py-1 rounded-full text-white bg-blue-500">
              ${(c.status || "").toUpperCase()}
            </span>
            <div class="flex gap-2 justify-start lg:justify-end mt-2">
              <button data-id="${c.id}" class="btn-editar bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-1 px-3 rounded">Editar</button>
              <button data-id="${c.id}" class="btn-inativar bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-3 rounded">Inativar</button>
            </div>
          </div>
        `;

        card.querySelector(".btn-editar").addEventListener("click", () => editarCartinha(c.id));
        card.querySelector(".btn-inativar").addEventListener("click", () => inativarCartinha(c.id));

        listaCartinhasBody.appendChild(card);
      });
    } catch {
      listaCartinhasBody.innerHTML = `<p class="text-center text-red-500 py-4">Erro ao carregar cartinhas.</p>`;
    }
  }

  async function editarCartinha(id) {
    const resp = await fetch(`${API_URL}?evento=${eventoAtual}`);
    const dados = await resp.json();
    const c = dados.cartinha.find(x => x.id === id);
    if (!c) return alert("Cartinha não encontrada.");

    editandoId = id;
    form.nome_crianca.value = c.nome_crianca;
    form.idade.value = c.idade;
    form.sexo.value = c.sexo;
    form.sonho.value = c.sonho;
    form.escola.value = c.escola;
    form.cidade.value = c.cidade;
    form.psicologa_responsavel.value = c.psicologa_responsavel;
    form.telefone_contato.value = c.telefone_contato;
    form.status.value = c.status;
    previewImagem.innerHTML = c.imagem_cartinha?.[0]
      ? `<img src="${c.imagem_cartinha[0].url}" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`
      : "";
  }

  // ============================================================
  // 🔹 Inativar cartinha (sem excluir)
  // ============================================================
  async function inativarCartinha(id) {
    if (!confirm("Marcar esta cartinha como inativa?")) return;
    try {
      const resp = await fetch(`${API_URL}?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inativa" }),
      });
      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert("Cartinha marcada como inativa!");
        carregarCartinhas();
      }
    } catch {
      alert("Erro ao atualizar cartinha.");
    }
  }

  // Inicialização
  carregarEventos();
})();