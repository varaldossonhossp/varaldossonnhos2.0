// ============================================================
// 💌 VARAL DOS SONHOS — Gerenciar Cartinhas (versão final TCC)
// ------------------------------------------------------------
// • CRUD completo via /api/cartinha
// • Usa upload de arquivo (requer backend configurado para FormData/Multer)
// • Exibição moderna com Tailwind (cards responsivos)
// ============================================================

(() => {
  const API_URL = "../api/cartinha";
  const listaCartinhasBody = document.querySelector("#lista-cartinhas-body");
  const totalCartinhasSpan = document.querySelector("#total-cartinhas");
  const form = document.querySelector("#form-cartinha");
  const previewImagem = document.querySelector("#preview-imagem");

  let editandoId = null;

  // ============================================================
  // 🔹 Cor do Status (para os cards)
  // ============================================================
  function getStatusColor(status) {
    if (!status) return "bg-gray-400";
    const s = status.toLowerCase();
    if (s === "disponivel") return "bg-green-500";
    if (s === "adotada") return "bg-yellow-500";
    return "bg-blue-500";
  }

  // ============================================================
  // 🔹 Pré-visualização da imagem (arquivo local)
  // ============================================================
  form.imagem_cartinha.addEventListener("change", () => {
    const file = form.imagem_cartinha.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImagem.innerHTML = `
          <img src="${e.target.result}" 
               alt="Pré-visualização" 
               class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto"
               style="max-width: 150px;">
        `;
      };
      reader.readAsDataURL(file);
    } else {
      previewImagem.innerHTML = "";
    }
  });

  // ============================================================
  // 🔹 Carregar cartinhas e renderizar como cards
  // ============================================================
  async function carregarCartinhas() {
    listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Carregando...</p>`;
    totalCartinhasSpan.textContent = "0";

    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();
      const cartinhas = dados.cartinha || [];

      if (!dados.sucesso || cartinhas.length === 0) {
        listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Nenhuma cartinha cadastrada.</p>`;
        return;
      }

      totalCartinhasSpan.textContent = cartinhas.length;
      listaCartinhasBody.innerHTML = "";

      cartinhas.forEach((c) => {
        // Lógica de extração da URL do Airtable permanece a mesma
        const imgUrl =
          Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
            ? c.imagem_cartinha[0].url
            : "../imagens/cartinha-padrao.png";

        const card = document.createElement("div");
        card.className =
          "p-4 border border-blue-200 rounded-xl shadow-md bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center";

        card.innerHTML = `
          <div class="flex items-center gap-4 w-full lg:w-3/4">
            <img src="${imgUrl}" alt="Cartinha" class="w-16 h-16 object-cover rounded-full border-2 border-blue-400">
            <div class="flex-1">
              <p class="text-lg font-semibold text-gray-800">${c.nome_crianca} (${c.idade} anos, ${c.sexo})</p>
              <p class="text-sm text-gray-600 truncate">🎁 Sonho: ${c.sonho}</p>
              <p class="text-xs text-gray-500 mt-1">🏫 ${c.escola} — ${c.cidade}</p>
              <p class="text-xs text-gray-500">👩‍🏫 ${c.psicologa_responsavel} (${c.telefone_contato})</p>
            </div>
          </div>
          <div class="flex flex-col space-y-2 lg:w-1/4 lg:text-right w-full mt-4 lg:mt-0">
            <span class="text-xs font-medium px-3 py-1 self-start lg:self-end rounded-full text-white ${getStatusColor(
              c.status
            )}">
              ${(c.status || "").toUpperCase()}
            </span>
            <div class="flex gap-2 justify-start lg:justify-end mt-2">
              <button data-id="${c.id}" class="btn-editar bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-1 px-3 rounded transition">
                Editar
              </button>
              <button data-id="${c.id}" class="btn-excluir bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded transition">
                Excluir
              </button>
            </div>
          </div>
        `;

        // Eventos dos botões
        card.querySelector(".btn-editar").addEventListener("click", () => editarCartinha(c.id));
        card.querySelector(".btn-excluir").addEventListener("click", () => excluirCartinha(c.id));

        listaCartinhasBody.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar cartinhas:", err);
      listaCartinhasBody.innerHTML = `<p class="text-center text-red-500 py-4">Erro ao carregar cartinhas.</p>`;
    }
  }

  // ============================================================
  // 🔹 Criar ou Atualizar Cartinha (com upload de arquivo)
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Crie FormData para incluir o arquivo e outros campos
    const formData = new FormData();
    
    formData.append("nome_crianca", form.nome_crianca.value);
    // Nota: FormData converte para string, o backend deve re-converter
    formData.append("idade", form.idade.value); 
    formData.append("sexo", form.sexo.value);
    formData.append("sonho", form.sonho.value);
    formData.append("escola", form.escola.value);
    formData.append("cidade", form.cidade.value);
    formData.append("psicologa_responsavel", form.psicologa_responsavel.value);
    formData.append("telefone_contato", form.telefone_contato.value);
    formData.append("status", form.status.value);
    
    // 2. Adicione o arquivo de imagem APENAS SE EXISTIR
    const imagemFile = form.imagem_cartinha.files[0];
    if (imagemFile) {
        // O backend buscará este campo: 'imagem_cartinha'
        formData.append("imagem_cartinha", imagemFile); 
    }

    try {
      const metodo = editandoId ? "PATCH" : "POST";
      const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;

      const resp = await fetch(url, {
        method: metodo,
        // IMPORTANTE: NÃO defina Content-Type. O navegador faz isso automaticamente para FormData
        body: formData, // Envia o FormData diretamente
      });

      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert(editandoId ? "Cartinha atualizada com sucesso!" : "Cartinha criada com sucesso!");
        form.reset();
        previewImagem.innerHTML = "";
        editandoId = null;
        carregarCartinhas();
        listaCartinhasBody.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        alert("Erro ao salvar: " + resultado.mensagem);
      }
    } catch (err) {
      console.error("Erro ao salvar cartinha:", err);
      alert("Erro ao salvar cartinha.");
    }
  });

  // ============================================================
  // 🔹 Editar Cartinha
  // ============================================================
  async function editarCartinha(id) {
    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();
      const c = dados.cartinha.find((x) => x.id === id);
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
      
      // Limpa o campo de upload (file input)
      form.imagem_cartinha.value = null; 

      // Exibe imagem atual (se houver link do Airtable)
      const currentImageUrl = Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0] ? c.imagem_cartinha[0].url : "";
      
      previewImagem.innerHTML = currentImageUrl
        ? `<img src="${currentImageUrl}" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`
        : "";

      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      console.error("Erro ao editar cartinha:", err);
    }
  }

  // ============================================================
  // 🔹 Excluir Cartinha
  // ============================================================
  async function excluirCartinha(id) {
    if (!confirm("Deseja realmente excluir esta cartinha?")) return;
    try {
      const resp = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert("Cartinha excluída!");
        carregarCartinhas();
      } else {
        alert("Erro ao excluir: " + resultado.mensagem);
      }
    } catch (err) {
      console.error("Erro ao excluir cartinha:", err);
      alert("Erro ao excluir cartinha.");
    }
  }

  // ============================================================
  // 🚀 Inicialização
  // ============================================================
  carregarCartinhas();
})();