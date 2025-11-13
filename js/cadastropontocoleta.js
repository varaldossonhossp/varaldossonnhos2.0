let pontos = [];
let editIndex = null;

function atualizarLista() {
  const lista = document.getElementById("pontos-lista");
  const total = document.getElementById("total-pontos");

  if (pontos.length === 0) {
    lista.innerHTML = `<p class="text-center text-gray-500">Nenhum ponto cadastrado ainda.</p>`;
    total.textContent = 0;
    return;
  }

  total.textContent = pontos.length;

  lista.innerHTML = pontos.map((p, index) => `
    <div class="p-4 border rounded-lg shadow-sm bg-blue-50">
      <p><strong>Nome:</strong> ${p.nome}</p>
      <p><strong>Responsável:</strong> ${p.responsavel}</p>
      <p><strong>Endereço:</strong> ${p.endereco}, Nº ${p.numero}</p>
      <p><strong>Telefone:</strong> ${p.telefone}</p>
      <p><strong>Email:</strong> ${p.email}</p>
      <p><strong>Status:</strong> ${p.status}</p>

      <div class="mt-3 flex gap-3">
        <button onclick="editar(${index})" class="px-4 py-2 bg-yellow-500 text-white rounded">✏️ Editar</button>
        <button onclick="excluir(${index})" class="px-4 py-2 bg-red-600 text-white rounded">🗑️ Excluir</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("form-ponto").addEventListener("submit", e => {
  e.preventDefault();

  const ponto = {
    nome: nome_ponto.value,
    responsavel: responsavel.value,
    endereco: endereco.value,
    numero: numero.value,
    telefone: telefone.value,
    email: email_ponto.value,
    horario: horario.value,
    status: status.value
  };

  if (editIndex === null) {
    pontos.push(ponto);
  } else {
    pontos[editIndex] = ponto;
    editIndex = null;
  }

  atualizarLista();
  e.target.reset();
});

document.getElementById("btn-limpar").onclick = () => {
  document.getElementById("form-ponto").reset();
  editIndex = null;
};

function editar(i) {
  const p = pontos[i];

  nome_ponto.value = p.nome;
  responsavel.value = p.responsavel;
  endereco.value = p.endereco;
  numero.value = p.numero;
  telefone.value = p.telefone;
  email_ponto.value = p.email;
  horario.value = p.horario;
  status.value = p.status;

  editIndex = i;
}

function excluir(i) {
  if (confirm("Deseja realmente excluir este ponto?")) {
    pontos.splice(i, 1);
    atualizarLista();
  }
}

window.onload = atualizarLista;
