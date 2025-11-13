let cartinhas = [];
let editIndex = null;

// Atualiza lista visual
function atualizarLista() {
  const lista = document.getElementById("cartinhas-lista");
  const total = document.getElementById("total-cartinhas");

  if (cartinhas.length === 0) {
    lista.innerHTML = `<p class="text-center text-gray-500">Nenhuma cartinha cadastrada ainda.</p>`;
    total.textContent = 0;
    return;
  }

  total.textContent = cartinhas.length;

  lista.innerHTML = cartinhas
    .map(
      (c, index) => `
    <div class="p-4 border rounded-lg shadow-sm bg-blue-50">
      <p><strong>Nome:</strong> ${c.nome_crianca}</p>
      <p><strong>Idade:</strong> ${c.idade}</p>
      <p><strong>Sexo:</strong> ${c.sexo}</p>
      <p><strong>Sonho:</strong> ${c.sonho}</p>
      <p><strong>Status:</strong> ${c.status}</p>

      <div class="mt-3 flex gap-3">
        <button onclick="editar(${index})" class="px-4 py-2 bg-yellow-500 text-white rounded">✏️ Editar</button>
        <button onclick="excluir(${index})" class="px-4 py-2 bg-red-600 text-white rounded">🗑️ Excluir</button>
      </div>
    </div>
  `
    )
    .join("");
}

// Enviar para a API (POST)
async function salvarNoAirtable(cartinha) {
  try {
    const form = new FormData();

    for (const key in cartinha) {
      form.append(key, cartinha[key]);
    }

    form.append("imagem_cartinha", JSON.stringify([])); // sem imagem por enquanto

    const resp = await fetch("/api/cartinha", {
      method: "POST",
      body: form,
    });

    const json = await resp.json();
    if (!json.sucesso) {
      alert("Erro ao salvar no Airtable!");
      return false;
    }

    return true;
  } catch (error) {
    alert("Erro: " + error.message);
    return false;
  }
}

// SUBMIT
document
  .getElementById("form-cartinha")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const novaCartinha = {
      nome_crianca: nome_crianca.value,
      idade: idade.value,
      sexo: sexo.value,
      irmaos: irmaos.value,
      idade_irmaos: idade_irmaos.value,
      sonho: sonho.value,
      escola: escola.value,
      cidade: cidade.value,
      telefone_contato: telefone_contato.value,
      psicologa_responsavel: psicologa_responsavel.value,
      observacoes_admin: observacoes_admin.value,
      status: status.value,
    };

    const sucesso = await salvarNoAirtable(novaCartinha);
    if (!sucesso) return;

    if (editIndex === null) {
      cartinhas.push(novaCartinha);
    } else {
      cartinhas[editIndex] = novaCartinha;
      editIndex = null;
    }

    atualizarLista();
    e.target.reset();
  });

// Botão limpar
document.getElementById("btn-limpar").onclick = () => {
  document.getElementById("form-cartinha").reset();
  editIndex = null;
};

// Editar visual
function editar(i) {
  const c = cartinhas[i];

  nome_crianca.value = c.nome_crianca;
  idade.value = c.idade;
  sexo.value = c.sexo;
  irmaos.value = c.irmaos;
  idade_irmaos.value = c.idade_irmaos;
  sonho.value = c.sonho;
  escola.value = c.escola;
  cidade.value = c.cidade;
  telefone_contato.value = c.telefone_contato;
  psicologa_responsavel.value = c.psicologa_responsavel;
  observacoes_admin.value = c.observacoes_admin;
  status.value = c.status;

  editIndex = i;
}

// Excluir da conferência
function excluir(i) {
  if (confirm("Excluir somente da lista de conferência?")) {
    cartinhas.splice(i, 1);
    atualizarLista();
  }
}

window.onload = atualizarLista;
