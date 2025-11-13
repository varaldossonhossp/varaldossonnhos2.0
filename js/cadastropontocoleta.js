let pontos = [];
let editIndexPonto = null;

function atualizarListaPontos() {
  const lista = document.getElementById("pontos-lista");
  const total = document.getElementById("total-pontos");

  if (pontos.length === 0) {
    lista.innerHTML = `<p class="text-center text-gray-500">Nenhum ponto cadastrado ainda.</p>`;
    total.textContent = 0;
    return;
  }

  total.textContent = pontos.length;

  lista.innerHTML = pontos.map((p, i) => `
    <div class="p-4 border rounded-lg shadow-sm bg-blue-50">
      <p><strong>Nome:</strong> ${p.nome_ponto}</p>
      <p><strong>Responsável:</strong> ${p.responsavel}</p>
      <p><strong>Endereço:</strong> ${p.endereco}, Nº ${p.numero}</p>
      <p><strong>Telefone:</strong> ${p.telefone}</p>
      <p><strong>E-mail:</strong> ${p.email_ponto}</p>
      <p><strong>Status:</strong> ${p.status}</p>
      <div class="mt-3 flex gap-3">
        <button onclick="editarPonto(${i})" class="px-4 py-2 bg-yellow-500 text-white rounded">✏️ Editar</button>
        <button onclick="excluirPonto(${i})" class="px-4 py-2 bg-red-600 text-white rounded">🗑 Excluir</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("form-ponto").addEventListener("submit", e => {
  e.preventDefault();

  const ponto = {
    nome_ponto: nome_ponto.value,
    responsavel: responsavel.value,
    endereco: endereco.value,
    numero: numero.value,
    telefone: telefone.value,
    email_ponto: email_ponto.value,
    horario: horario.value,
    status: status.value
  };

  if (editIndexPonto === null) {
    pontos.push(ponto);
  } else {
    pontos[editIndexPonto] = ponto;
    editIndexPonto = null;
  }

  atualizarListaPontos();
  e.target.reset();
});

document.getElementById("btn-limpar").onclick = () => {
  document.getElementById("form-ponto").reset();
  editIndexPonto = null;
};

function editarPonto(i) {
  const p = pontos[i];
  nome_ponto.value = p.nome_ponto;
  responsavel.value = p.responsavel;
  endereco.value = p.endereco;
  numero.value = p.numero;
  telefone.value = p.telefone;
  email_ponto.value = p.email_ponto;
  horario.value = p.horario;
  status.value = p.status;
  editIndexPonto = i;
}

function excluirPonto(i) {
  if (confirm("Deseja realmente excluir este ponto desta conferência?")) {
    pontos.splice(i, 1);
    atualizarListaPontos();
  }
}

window.onload = atualizarListaPontos;
