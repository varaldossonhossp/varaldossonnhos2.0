// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js
// ------------------------------------------------------------
// - Cadastro de cartinhas pelo painel admin
// - Upload Cloudinary (unsigned)
// - Envio de id_evento para Airtable
// - Edição / exclusão
// - Lista de conferência
// ============================================================

//  Cloudinary
const CLOUD_NAME = "drnn5zmxi";
const UPLOAD_PRESET = "unsigned_uploads";

let uploadedUrl = "";
let cartinhasSessao = [];
let cadastroSessaoId = null;
let editIndex = null;

// ============================================================
// INICIALIZAÇÃO
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
  // 🔤 Title Case
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
  // 📞 Máscara de telefone
  // ------------------------------------------------------------
  document.getElementById("telefone_contato").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 5) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    e.target.value = v;
  });

  // ------------------------------------------------------------
  // 🎉 Carregar EVENTOS no select
  // ------------------------------------------------------------
  async function carregarEventos() {
    try {
      const resp = await fetch("/api/eventos");
      const json = await resp.json();

      if (!json.sucesso) return;

      const select = document.getElementById("id_evento");
      json.eventos.forEach(ev => {
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.textContent = ev.fields.nome_evento;
        select.appendChild(opt);
      });

    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    }
  }
  carregarEventos();

  // ------------------------------------------------------------
  // 🖼️ Upload de imagem
  // ------------------------------------------------------------
  form.imagem_cartinha.addEventListener("change", async () => {

    const file = form.imagem_cartinha.files[0];
    if (!file) {
      uploadedUrl = editIndex !== null ? cartinhasSessao[editIndex]?.imagem_cartinha : "";
      previewImagem.innerHTML = uploadedUrl ? `<img src="${uploadedUrl}" class="w-32 rounded-lg shadow">` : "";
      return;
    }

    previewImagem.innerHTML = "<p class='text-blue-600'>Enviando imagem...</p>";

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd });

      const data = await resp.json();

      if (data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `<img src="${uploadedUrl}" class="w-32 rounded-lg shadow">`;
      } else {
        uploadedUrl = "";
        previewImagem.innerHTML = "<p class='text-red-500'>Falha no upload</p>";
      }

    } catch {
      uploadedUrl = "";
      previewImagem.innerHTML = "<p class='text-red-500'>Erro no upload</p>";
    }
  });

  // ------------------------------------------------------------
  // 📨 SALVAR (POST / PATCH)
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

      // 👉 NOVO — Evento
      id_evento: form.id_evento.value,
    };

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

        if (!json.sucesso) return alert("Erro ao salvar cartinha!");

        const idAirtable = json.novo[0].id;

        cartinhasSessao.push({
          id: idAirtable,
          ...payload,
          imagem_cartinha: urlImg
        });

        alert("Cartinha cadastrada com sucesso! 💙");
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
          imagem_cartinha: urlImg,
        };

        alert("Cartinha atualizada! ✔");
      }

      editIndex = null;
      form.reset();
      uploadedUrl = "";
      previewImagem.innerHTML = "";
      atualizarLista();

    } catch (err) {
      console.error("Erro ao salvar cartinha:", err);
      alert("Erro inesperado!");
    }
  });

  // LIMPAR
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
    lista.innerHTML = `<p class="text-gray-500 text-center">
      Nenhuma cartinha cadastrada nesta sessão.
    </p>`;
    total.textContent = "0";
    return;
  }

  total.textContent = cartinhasSessao.length;

  lista.innerHTML = cartinhasSessao.map((c, idx) => `
    <div class="p-4 bg-blue-50 border rounded-lg shadow relative">

      ${c.imagem_cartinha ? `<img src="${c.imagem_cartinha}" class="w-24 h-24 rounded-lg shadow float-right ml-4">` : ""}

      <p><strong>Nome:</strong> ${c.nome_crianca}</p>
      <p><strong>Idade:</strong> ${c.idade}</p>
      <p><strong>Sexo:</strong> ${c.sexo}</p>
      <p><strong>Evento:</strong> ${c.id_evento || "-"}</p>
      <p><strong>Sonho:</strong> ${c.sonho}</p>

      <div class="flex gap-4 mt-3">
        <button onclick="editarCartinha(${idx})"
          class="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow">
          ✏️ Editar
        </button>

        <button onclick="excluirCartinha(${idx})"
          class="px-4 py-2 bg-red-600 text-white rounded-lg shadow">
          🗑️ Excluir
        </button>
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
    const resp = await fetch(`/api/cartinha?id=${c.id}`, {
      method: "DELETE"
    });
    const json = await resp.json();
    if (!json.sucesso) return alert("Erro ao excluir!");
  }

  cartinhasSessao.splice(idx, 1);
  atualizarLista();
  alert("Cartinha excluída!");
}
