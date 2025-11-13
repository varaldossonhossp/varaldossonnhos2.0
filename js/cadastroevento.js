let eventos = [];
let editIndex = null;

function atualizarLista() {
  const lista = document.getElementById("eventos-lista");
  const total = document.getElementById("total-eventos");

  if (eventos.length === 0) {
    lista.innerHTML = `<p class="text-center text-gray-500">Nenhum evento cadastrado ainda.</p>`;
    total.textContent = 0;
    return;
  }

  total.textContent = eventos.length;

  lista.innerHTML = eventos.map((ev, index) => `
    <div class="p-4 border rounded-lg shadow-sm bg-blue-50">
      <p><strong>Nome:</strong> ${ev.nome}</p>
      <p><strong>Data:</strong> ${ev.data}</p>
      <p><strong>Limite:</strong> ${ev.limite}</p>
      <p><strong>Local:</strong> ${ev.local}</p>
      <p><strong>Status:</strong> ${ev.status}</p>

      <div class="mt-3 flex gap-3">
        <button onclick="editar(${index})" class="px-4 py-2 bg-yellow-500 text-white rounded">✏️ Editar</button>
        <button onclick="excluir(${index})" class="px-4 py-2 bg-red-600 text-white rounded">🗑️ Excluir</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("form-evento").addEventListener("submit", e => {
  e.preventDefault();

  const evento = {
    nome: nome_evento.value,
    data: data_evento.value,
    limite: data_limite.value,
    local: local_evento.value,
    descricao: descricao.value,
    status: status_evento.value
  };

  if (editIndex === null) {
    eventos.push(evento);
  } else {
    eventos[editIndex] = evento;
    editIndex = null;
  }

  atualizarLista();
  e.target.reset();
});

document.getElementById("btn-limpar").onclick = () => {
  document.getElementById("form-evento").reset();
  editIndex = null;
};

function editar(i) {
  const ev = eventos[i];

  nome_evento.value = ev.nome;
  data_evento.value = ev.data;
  data_limite.value = ev.limite;
  local_evento.value = ev.local;
  descricao.value = ev.descricao;
  status_evento.value = ev.status;

  editIndex = i;
}

function excluir(i) {
  if (confirm("Deseja realmente excluir este evento?")) {
    eventos.splice(i, 1);
    atualizarLista();
  }
}

window.onload = atualizarLista;
