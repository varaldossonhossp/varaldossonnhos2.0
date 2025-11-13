// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js (versão completa)
// ------------------------------------------------------------
// - Cadastro de cartinhas
// - Seleção de evento com nome + datas
// - Upload Cloudinary
// - Salvar no Airtable incluindo id_evento
// - Lista de conferência completa
// ============================================================

// Cloudinary
const CLOUD_NAME = "drnn5zmxi";
const UPLOAD_PRESET = "unsigned_uploads";

let uploadedUrl = "";
let cartinhasSessao = [];
let cadastroSessaoId = null;
let editIndex = null;

// Mapa: id_evento → dados do evento
let mapaEventos = {}; 

// ============================================================
// Inicialização
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("form-cartinha");
  const previewImagem = document.getElementById("preview-imagem");
  const btnLimpar = document.getElementById("btn-limpar");

  // Criar ID de sessão
  cadastroSessaoId = sessionStorage.getItem("cadastro_sessao_id");
  if (!cadastroSessaoId) {
    cadastroSessaoId = "sessao-" + Date.now();
    sessionStorage.setItem("cadastro_sessao_id", cadastroSessaoId);
  }

  // ------------------------------------------------------------
  // Title Case
  // ------------------------------------------------------------
  const titleCase = (str) =>
    str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

  ["nome_crianca", "escola", "cidade", "psicologa_responsavel", "sonho"]
    .forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener("blur", () => {
        if (el.value.trim()) el.value = titleCase(el.value.trim());
      });
    });

  // ------------------------------------------------------------
  // Máscara telefone
  // ------------------------------------------------------------
  document.getElementById("telefone_contato").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 5) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    e.target.value = v;
  });

  // ------------------------------------------------------------
  // 🎉 Carregar EVENTOS
  // ------------------------------------------------------------
  async function carregarEventos() {
    try {
      const resp = await fetch("/api/eventos");
      const json = await resp.json();

      if (!json.sucesso) return;

      const select = document.getElementById("id_evento");
      select.innerHTML = `<option value="">Selecione um evento</option>`;

      json.eventos.forEach(ev => {
        const el = ev.fields;

        // Salva tudo no mapa
        mapaEventos[ev.id] = {
          nome: el.nome_evento,
          data_evento: el.data_evento || "",
          data_limite_recebimento: el.data_limite_recebimento || ""
        };

        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.textContent = `${el.nome_evento} (${el.data_evento})`;
        select.appendChild(opt);
      });

    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    }
  }
  carregarEventos();

  // Mostrar as datas quando selecionar um evento
  document.getElementById("id_evento").addEventListener("change", () => {
    const id = document.getElementById("id_evento").value;
    const box = document.getElementById("evento-info");

    if (!id || !mapaEventos[id]) {
      box.innerHTML = "";
      return;
    }

    const ev = mapaEventos[id];

    box.innerHTML = `
      <div class="mt-2 text-sm text-blue-800 bg-blue-50 p-2 rounded border border-blue-200">
        <strong>Evento selecionado:</strong> ${ev.nome}<br>
        <strong>Data do Evento:</strong> ${ev.data_evento}<br>
        <strong>Data Limite:</strong> ${ev.data_limite_recebimento}
      </div>
    `;
  });

  // ------------------------------------------------------------
  // Upload Cloudinary
  // ------------------------------------------------------------
  form.imagem_cartinha.addEventListener("change", async () => {

    const file = form.imagem_cartinha.files[0];
    if (!file) {
      uploadedUrl = editIndex !== null ? cartinhasSessao[editIndex]?.imagem_cartinha : "";
      previewImagem.innerHTML = uploadedUrl ? `<img src="${uploadedUrl}" class="w-32 rounded">` : "";
      return;
    }

    previewImagem.innerHTML = "<p class='text-blue-600'>Enviando...</p>";

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd });

      const data = await resp.json();

      if (data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `<img src="${uploadedUrl}" class="w-32 rounded shadow">`;
      } else {
        previewImagem.innerHTML = "<p class='text-red-500'>Falha</p>";
      }

    } catch {
      previewImagem.innerHTML = "<p class='text-red-500'>Erro</p>";
    }
  });

  // ------------------------------------------------------------
  // SALVAR
  // ------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isEdit = editIndex !== null;
    const atual = isEdit ? cartinhasSessao[editIndex] : null;

    const urlImg = uploadedUrl || (atual ? atual.imagem_cartinha : "");

    const payload = {
      nome_crianca: form.nome_crianca.value,
      idade: form.idade.value,
      sexo: form.sexo.value,
      escola: form.escola.value,
      cidade: form.cidade.value,
      telefone_contato: form.telefone_contato.value,
      psicologa_responsavel: form.psicologa_responsavel.value,
      irmaos: form.irmaos.value,
      idade_irmaos: form.idade_irmaos.value,
      sonho: form.sonho.value,
      observacoes_admin: form.observacoes_admin.value,
      status: form.status.value,
      cadastro_sessao_id: cadastroSessaoId,
      id_evento: form.id_evento.value
    };

    const ev = mapaEventos[payload.id_evento] || { nome: "", data_evento: "", data_limite_recebimento: "" };

    payload.imagem_cartinha = urlImg
      ? JSON.stringify([{ url: urlImg }])
      : JSON.stringify([]);

    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

    try {
      let resp, json;

      // NOVO
      if (!isEdit) {
        resp = await fetch("/api/cartinha", { method: "POST", body: formData });
        json = await resp.json();

        if (!json.sucesso) return alert("Erro ao salvar!");

        const idAirtable = json.novo[0].id;

        cartinhasSessao.push({
          id: idAirtable,
          ...payload,
          evento_nome: ev.nome,
          evento_data: ev.data_evento,
          evento_limite: ev.data_limite_recebimento,
          imagem_cartinha: urlImg
        });

        alert("Cartinha salva! 💙");
      }

      // EDITAR
      else {
        resp = await fetch(`/api/cartinha?id=${atual.id}`, {
          method: "PATCH",
          body: formData,
        });

        json = await resp.json();
        if (!json.sucesso) return alert("Erro ao atualizar!");

        cartinhasSessao[editIndex] = {
          ...cartinhasSessao[editIndex],
          ...payload,
          evento_nome: ev.nome,
          evento_data: ev.data_evento,
          evento_limite: ev.data_limite_recebimento,
          imagem_cartinha: urlImg,
        };

        alert("Cartinha atualizada!");
      }

      form.reset();
      uploadedUrl = "";
      previewImagem.innerHTML = "";
      editIndex = null;
      atualizarLista();

    } catch (err) {
      console.error("Erro salvar cartinha:", err);
      alert("Erro inesperado!");
    }
  });

  btnLimpar.addEventListener("click", () => {
    editIndex = null;
    form.reset();
    previewImagem.innerHTML = "";
    uploadedUrl = "";
  });

  atualizarLista();
});

// ============================================================
// LISTA DE CONFERÊNCIA
// ============================================================
function atualizarLista() {
  const lista = document.getElementById("cartinhas-lista");
  const total = document.getElementById("total-cartinhas");

  if (!cartinhasSessao.length) {
    lista.innerHTML = `<p class="text-gray-500 text-center">Nenhuma cartinha cadastrada.</p>`;
    total.textContent = "0";
    return;
  }

  total.textContent = cartinhasSessao.length;

  lista.innerHTML = cartinhasSessao.map((c, idx) => `
    <div class="p-4 bg-blue-50 border rounded-lg shadow">

      ${c.imagem_cartinha ? `<img src="${c.imagem_cartinha}" class="w-24 h-24 rounded float-right ml-4">` : ""}

      <p><strong>Nome:</strong> ${c.nome_crianca}</p>
      <p><strong>Idade:</strong> ${c.idade}</p>
      <p><strong>Sexo:</strong> ${c.sexo}</p>

      <p><strong>Evento:</strong> ${c.evento_nome || "-"}</p>
      <p><strong>Data do Evento:</strong> ${c.evento_data || "-"}</p>
      <p><strong>Data Limite:</strong> ${c.evento_limite || "-"}</p>

      <p><strong>Sonho:</strong> ${c.sonho}</p>

      <div class="flex gap-4 mt-3">
        <button onclick="editarCartinha(${idx})"
          class="px-4 py-2 bg-yellow-500 text-white rounded-lg">✏️ Editar</button>

        <button onclick="excluirCartinha(${idx})"
          class="px-4 py-2 bg-red-600 text-white rounded-lg">🗑️ Excluir</button>
      </div>
    </div>
  `).join("");
}

// ============================================================
// EDITAR
// ============================================================
function editarCartinha(idx) {
  const c = cartinhasSessao[idx];
  const form = document.getElementById("form-cartinha");

  form.nome_crianca.value = c.nome_crianca;
  form.idade.value = c.idade;
  form.sexo.value = c.sexo;
  form.escola.value = c.escola;
  form.cidade.value = c.cidade;
  form.telefone_contato.value = c.telefone_contato;
  form.psicologa_responsavel.value = c.psicologa_responsavel;
  form.irmaos.value = c.irmaos;
  form.idade_irmaos.value = c.idade_irmaos;
  form.sonho.value = c.sonho;
  form.observacoes_admin.value = c.observacoes_admin;
  form.status.value = c.status;
  form.id_evento.value = c.id_evento;

  uploadedUrl = c.imagem_cartinha;

  document.getElementById("preview-imagem").innerHTML =
    uploadedUrl ? `<img src="${uploadedUrl}" class="w-32 rounded shadow">` : "";

  editIndex = idx;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// EXCLUIR
// ============================================================
async function excluirCartinha(idx) {
  const c = cartinhasSessao[idx];
  if (!confirm("Excluir essa cartinha?")) return;

  if (c.id) {
    const resp = await fetch(`/api/cartinha?id=${c.id}`, { method: "DELETE" });
    const json = await resp.json();
    if (!json.sucesso) return alert("Erro ao excluir!");
  }

  cartinhasSessao.splice(idx, 1);
  atualizarLista();
  alert("Cartinha excluída!");
}
