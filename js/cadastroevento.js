const sessionId = Date.now().toString();

async function salvarEvento(data){
  const form = new FormData();
  for(const k in data){ form.append(k, data[k]); }
  form.append("cadastro_sessao_id", sessionId);

  const r = await fetch("/api/eventos", {
    method:"POST",
    body:form
  });

  return r.json();
}

async function carregarEventos(){
  const r = await fetch(`/api/eventos?session=${sessionId}`);
  const json = await r.json();

  const lista = document.getElementById("eventos-lista");
  const total = document.getElementById("total-eventos");

  if(!json.sucesso || json.eventos.length===0){
    lista.innerHTML = `<p class='text-gray-500'>Nenhum evento cadastrado.</p>`;
    total.textContent=0;
    return;
  }

  total.textContent=json.eventos.length;

  lista.innerHTML=json.eventos.map(ev=>`
    <div class="p-4 bg-blue-50 border rounded-lg shadow">
      <p><strong>${ev.nome_evento}</strong></p>
      <p>Data: ${ev.data_evento}</p>
      <p>Local: ${ev.local_evento}</p>

      <div class="mt-3 flex gap-3 justify-center">
        <button onclick="editar('${ev.id}')" class="px-4 py-2 bg-yellow-600 text-white rounded">✏️ Editar</button>
        <button onclick="excluir('${ev.id}')" class="px-4 py-2 bg-red-600 text-white rounded">🗑 Excluir</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("form-evento").addEventListener("submit", async e=>{
  e.preventDefault();

  const data={
    nome_evento: nome_evento.value,
    data_evento: data_evento.value,
    data_limite_recebimento: data_limite_recebimento.value,
    local_evento: local_evento.value,
    descricao: descricao.value,
    status_evento: status_evento.value
  };

  await salvarEvento(data);
  await carregarEventos();
  e.target.reset();
});

document.getElementById("btn-limpar").onclick=()=>form-evento.reset();

async function excluir(id){
  await fetch(`/api/eventos?id=${id}&session=${sessionId}`,{method:"DELETE"});
  carregarEventos();
}

carregarEventos();
