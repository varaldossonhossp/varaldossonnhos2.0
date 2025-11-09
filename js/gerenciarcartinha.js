// ============================================================
// 💌 Gerenciar Cartinhas - JS (versão moderna)
// ------------------------------------------------------------
// Conecta com /api/cartinha (CRUD completo no Airtable)
// ============================================================

(() => {
  const API_URL = "../api/cartinha";
  // Mudar os seletores para os IDs da nova estrutura em blocos
  const listaCartinhasBody = document.querySelector("#lista-cartinhas-body");
  const totalCartinhasSpan = document.querySelector("#total-cartinhas");
  const form = document.querySelector("#form-cartinha");
  
  let editandoId = null;
  // Função auxiliar para determinar a cor do status no card
  function getStatusColor(status) {
    if (!status) return 'bg-gray-400';
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'disponivel':
          return 'bg-green-500';
      case 'adotada':
          return 'bg-yellow-500';
      default:
        return 'bg-blue-500'; // Default para outros status
    }
  }
  // ============================================================
  // 🔹 Carregar lista de cartinhas (AGORA EM CARDS)
  // ============================================================
  async function carregarCartinhas() {
    listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Carregando...<p>`;
    totalCartinhasSpan.textContent = '0';
    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();
      const cartinhas = dados.cartinha || [];
      
      totalCartinhasSpan.textContent = cartinhas.length;
      if (!dados.sucesso || !cartinhas.length) {
        listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Nenhumacartinha cadastrada.</p>`;
        return;
      }
      listaCartinhasBody.innerHTML = "";
      
      cartinhas.forEach((c) => {
        // Lógica para obter URL da imagem
        const imgUrl = Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
          ? c.imagem_cartinha[0].url
          : "../imagens/cartinha-padrao.png";
        // NOVO: Estrutura de Card (Bloco) com classes Tailwind
        const card = document.createElement("div");
        card.className = "p-4 border border-blue-200 rounded-xl shadow-md bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center";
        card.innerHTML = `
          <div class="flex items-center gap-4 w-full lg:w-3/4">
            <img src="${imgUrl}" alt="Cartinha" class="w-16 h-16 object-cover rounded-fullborder-2 border-blue-400">
            <div class="flex-1">
              <p class="text-lg font-semibold text-gray-800">${c.nome_crianca} (${c.idade} anos, ${c.sexo})</p>
              <p class="text-sm text-gray-600 truncate">Sonho: ${c.sonho}</p>
              <p class="text-xs text-gray-500 mt-1">Escola: ${c.escola} | Cidade: ${c.cidade}</p>
              <p class="text-xs text-gray-500">Resp.: ${c.psicologa_responsavel} (${c.telefone_contato})</p>
              <p class="text-xs text-gray-500">Ponto de Coleta: ${c.ponto_coleta || 'N/A'}</p>
            </div>
          </div>
          <div class="flex flex-col space-y-2 lg:w-1/4 lg:text-right w-full mt-4 lg:mt-0">
            <span class="text-xs font-medium px-3 py-1 self-start lg:self-end rounded-full text-white ${getStatusColor(c.status)}">
              ${(c.status || '').toUpperCase()}
            </span>
            <div class="flex gap-2 justify-start lg:justify-end mt-2">
              <button data-id="${c.id}" class="btn-editar bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-1 px-3 rounded transition duration-150">
                Editar
              </button>
              <button data-id="${c.id}" class="btn-excluir bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded transition duration-150">
                Excluir
              </button>
            </div>
          </div>
        `;
        listaCartinhasBody.appendChild(card);
        // Adiciona os eventos aos novos botões do card
        card.querySelector(".btn-editar").addEventListener("click", () => editarCartinha(c.id));
        card.querySelector(".btn-excluir").addEventListener("click", () => excluirCartinha(c.id));
      });
    } catch (err) {
      console.error("Erro ao carregar cartinhas:", err);
      listaCartinhasBody.innerHTML = `<p class="text-center text-red-500 py-4">Erro aocarregar cartinhas</p>`;
    }
  }
  // ============================================================
  // 🔹 Salvar (criar ou atualizar)
  // ============================================================
  // ... (A lógica do form.addEventListener("submit", ...) permanece a mesma) ...
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      nome_crianca: form.nome_crianca.value,
      idade: parseInt(form.idade.value) || null,
      sexo: form.sexo.value,
      sonho: form.sonho.value,
      imagem_cartinha: form.imagem_cartinha.value,
      escola: form.escola.value,
      cidade: form.cidade.value,
      psicologa_responsavel: form.psicologa_responsavel.value,
      telefone_contato: form.telefone_contato.value,
      status: form.status.value,
    };
    try {
      const metodo = editandoId ? "PATCH" : "POST";
      const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;
      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert(editandoId ? "Cartinha atualizada com sucesso!" : "Cartinha criada comsucesso!");
        form.reset();
        editandoId = null;
        carregarCartinhas();
        // Rola para o topo da lista de cartinhas após o salvamento
        listaCartinhasBody.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
      } else {
          alert("Erro ao salvar: " + resultado.mensagem);
      }
    } catch (err) {
      console.error("Erro ao salvar cartinha:", err);
      alert("Erro ao salvar cartinha.");
    }
  });
  // ============================================================
  // 🔹 Editar (Com Rolagem para o Formulário)
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
      form.imagem_cartinha.value = Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
        ? c.imagem_cartinha[0].url
        : c.imagem_cartinha;
      form.escola.value = c.escola;
      form.cidade.value = c.cidade;
      form.psicologa_responsavel.value = c.psicologa_responsavel;
      form.telefone_contato.value = c.telefone_contato;
      form.status.value = c.status;
      
      // NOVO: Rolagem suave para o formulário de edição
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        console.error("Erro ao editar cartinha:", err);
    }
  }
  // ============================================================
  // 🔹 Excluir
  // ============================================================
  // ... (A lógica de exclusão permanece a mesma) ...
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
  // 🚀 Inicializa
  // ============================================================
  carregarCartinhas();
})();




