// ============================================================
// 💙 VARAL DOS SONHOS — js/gerenciareventos.js
// ------------------------------------------------------------
// CRUD de eventos no Airtable (via /api/eventos)
// Inclui upload automático via Cloudinary.
// ============================================================

const API_URL = "/api/eventos";
const form = document.getElementById("formEvento");
const lista = document.getElementById("listaEventos");
const inputImagem = document.getElementById("imagem");
const preview = document.getElementById("previewImagem");

let imagemURL = "";
let editandoId = null;

// ============================================================
// 🔹 Upload de imagem para Cloudinary
// ============================================================
inputImagem.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "varaldossonhos"); // seu preset no Cloudinary

  const resp = await fetch("https://api.cloudinary.com/v1_1/seu_cloud_name/image/upload", {
    method: "POST",
    body: data,
  });
  const json = await resp.json();

  imagemURL = json.secure_url;
  preview.innerHTML = `<img src="${imagemURL}" alt="Prévia" style="max-height:150px;border-radius:10px;margin-top:10px;">`;
});

// ============================================================
// 🔹 Listar eventos já cadastrados
// ============================================================
async function carregarEventos() {
  lista.innerHTML = "<p>Carregando eventos...</p>";
  const resp = await fetch(`${API_URL}?tipo=all`);
  const dados = await resp.json();

  if (!dados.sucesso) {
    lista.innerHTML = "<p>Erro ao carregar eventos 😢</p>";
    return;
  }

  lista.innerHTML = dados.eventos
    .map(
      (ev) => `
      <div class="card evento-card">
        <img src="${ev.imagem?.[0]?.url || "../imagens/placeholder.png"}" alt="${ev.nome_evento}" class="thumb-evento" />
        <div class="info">
          <h3>${ev.nome_evento}</h3>
          <p>${ev.descricao || ""}</p>
          <small>📍 ${ev.local_evento || ""}</small><br>
          <small>📅 ${ev.data_evento || ""}</small><br>
          <small>🎯 Status: ${ev.status_evento}</small>
        </div>
        <div class="acoes">
          <button onclick="editarEvento('${ev.id}')">✏️ Editar</button>
          <button onclick="deletarEvento('${ev.id}')">🗑️ Excluir</button>
        </div>
      </div>`
    )
    .join("");
}

// ============================================================
// 🔹 Salvar novo evento ou atualizar existente
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("nome_evento", nome_evento.value);
  formData.append("descricao", descricao.value);
  formData.append("local_evento", local_evento.value);
  formData.append("data_evento", data_evento.value);
  formData.append("data_limite_recebimento", data_limite_recebimento.value);
  formData.append("status_evento", status_evento.value);
  formData.append("destacar_na_homepage", destacar_na_homepage.checked ? "true" : "false");

  if (imagemURL) {
    formData.append("imagem", JSON.stringify([{ url: imagemURL }]));
  }

  const metodo = editandoId ? "PATCH" : "POST";
  const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;

  const resp = await fetch(url, { method: metodo, body: formData });
  const resultado = await resp.json();

  if (resultado.sucesso) {
    alert(editandoId ? "Evento atualizado com sucesso!" : "Evento criado!");
    form.reset();
    imagemURL = "";
    preview.innerHTML = "";
    editandoId = null;
    carregarEventos();
  } else {
    alert("Erro ao salvar evento: " + resultado.mensagem);
  }
});

// ============================================================
// 🔹 Editar evento existente
// ============================================================
async function editarEvento(id) {
  const resp = await fetch(`${API_URL}?id=${id}`);
  const dados = await resp.json();
  if (!dados.sucesso) return alert("Erro ao carregar evento.");

  const ev = dados.evento;
  nome_evento.value = ev.nome_evento;
  descricao.value = ev.descricao;
  local_evento.value = ev.local_evento;
  data_evento.value = ev.data_evento;
  data_limite_recebimento.value = ev.data_limite_recebimento;
  status_evento.value = ev.status_evento;
  destacar_na_homepage.checked = ev.destacar_na_homepage;

  if (ev.imagem?.[0]?.url) {
    imagemURL = ev.imagem[0].url;
    preview.innerHTML = `<img src="${imagemURL}" alt="Prévia" style="max-height:150px;border-radius:10px;margin-top:10px;">`;
  }

  editandoId = id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// 🔹 Deletar evento
// ============================================================
async function deletarEvento(id) {
  if (!confirm("Tem certeza que deseja excluir este evento?")) return;
  const resp = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
  const dados = await resp.json();
  if (dados.sucesso) {
    alert("Evento removido com sucesso!");
    carregarEventos();
  } else {
    alert("Erro ao excluir evento.");
  }
}

// Inicialização
carregarEventos();
