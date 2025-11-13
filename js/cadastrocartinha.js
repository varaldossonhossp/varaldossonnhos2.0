// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js
// ------------------------------------------------------------
// - Cadastro de cartinhas pelo painel admin
// - Upload de imagem via Cloudinary (unsigned)
// - Máscara de telefone
// - Primeira letra maiúscula (Title Case)
// - Lista de conferência com foto + editar + excluir
// - POST (novo), PATCH (edição) e DELETE (exclusão) no /api/cartinha
// ============================================================

// 🌥 Configuração Cloudinary
const CLOUD_NAME = "drnn5zmxi";
const UPLOAD_PRESET = "unsigned_uploads";

let uploadedUrl = "";        // URL atual da imagem
let cartinhasSessao = [];    // Lista para conferência da sessão
let cadastroSessaoId = null; // ID da sessão (apenas controle interno)
let editIndex = null;        // Índice da cartinha sendo editada (null = novo)

// ============================================================
// Inicialização
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cartinha");
  const previewImagem = document.getElementById("preview-imagem");
  const btnLimpar = document.getElementById("btn-limpar");

  // ID da sessão (para rastrear cadastros feitos nessa tela)
  cadastroSessaoId = sessionStorage.getItem("cadastro_sessao_id");
  if (!cadastroSessaoId) {
    cadastroSessaoId = "sessao-" + Date.now();
    sessionStorage.setItem("cadastro_sessao_id", cadastroSessaoId);
  }

  // ============================================================
  // 🔤 PRIMEIRA LETRA MAIÚSCULA (TITLE CASE)
  // ============================================================
  const titleCase = (str) =>
    str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

  function aplicaTitleCase(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      if (el.value.trim()) el.value = titleCase(el.value.trim());
    });
  }

  ["nome_crianca", "escola", "cidade", "psicologa_responsavel", "sonho"].forEach(
    aplicaTitleCase
  );

  // ============================================================
  // 📞 MÁSCARA DE TELEFONE
  // ============================================================
  document.getElementById("telefone_contato").addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (valor.length > 5) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }
    e.target.value = valor;
  });

  // ============================================================
  // 🖼️ UPLOAD CLOUDINARY
  // ============================================================
  form.imagem_cartinha.addEventListener("change", async () => {
    const file = form.imagem_cartinha.files[0];
    if (!file) {
      // Se limpar o input de arquivo
      uploadedUrl = editIndex !== null
        ? (cartinhasSessao[editIndex]?.imagem_cartinha || "")
        : "";
      previewImagem.innerHTML = uploadedUrl
        ? `<img src="${uploadedUrl}" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`
        : "";
      return;
    }

    previewImagem.innerHTML =
      '<p class="text-blue-600">⏳ Enviando imagem...</p>';

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await resp.json();
      console.log("Resposta Cloudinary:", data);

      if (data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `
          <img src="${uploadedUrl}"
               alt="Prévia da cartinha"
               class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto"
               style="max-width: 150px;">
        `;
      } else {
        uploadedUrl = "";
        previewImagem.innerHTML =
          '<p class="text-red-500">❌ Falha no upload.</p>';
      }
    } catch (err) {
      console.error("Erro Cloudinary:", err);
      uploadedUrl = "";
      previewImagem.innerHTML =
        '<p class="text-red-500">Erro ao enviar imagem.</p>';
    }
  });

  // ============================================================
  // 📨 ENVIO PARA API (/api/cartinha) — NOVO ou EDIÇÃO
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isEdit = editIndex !== null;
    const registroAtual = isEdit ? cartinhasSessao[editIndex] : null;

    // Se estiver editando e não tiver feito novo upload,
    // mantemos a imagem anterior:
    const urlImagemParaSalvar =
      uploadedUrl || (registroAtual ? registroAtual.imagem_cartinha : "");

    const payload = {
      nome_crianca: form.nome_crianca.value.trim(),
      idade: form.idade.value.trim(),
      sexo: form.sexo.value,
      irmaos: form.irmaos.value.trim(),
      idade_irmaos: form.idade_irmaos.value.trim(),
      escola: form.escola.value.trim(),
      cidade: form.cidade.value.trim(),
      telefone_contato: form.telefone_contato.value.trim(),
      psicologa_responsavel: form.psicologa_responsavel.value.trim(),
      sonho: form.sonho.value.trim(),
      observacoes_admin: form.observacoes_admin.value.trim(),
      status: form.status.value,
      cadastro_sessao_id: cadastroSessaoId,
    };

    // Foto → attachment (Airtable)
    payload.imagem_cartinha = urlImagemParaSalvar
      ? JSON.stringify([{ url: urlImagemParaSalvar }])
      : JSON.stringify([]);

    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

    try {
      let resp, json;

      if (!isEdit) {
        // -------- NOVO REGISTRO (POST) --------
        resp = await fetch("/api/cartinha", {
          method: "POST",
          body: formData,
        });
        json = await resp.json();
        console.log("POST /api/cartinha:", json);

        if (!json.sucesso) {
          alert("❌ Erro ao salvar a cartinha no Airtable.");
          return;
        }

        const record = Array.isArray(json.novo) ? json.novo[0] : null;
        const airtableId = record ? record.id : null;

        cartinhasSessao.push({
          id: airtableId,
          ...payload,
          imagem_cartinha: urlImagemParaSalvar,
        });
        alert("💙 Cartinha cadastrada com sucesso!");
      } else {
        // -------- EDIÇÃO (PATCH) --------
        if (!registroAtual || !registroAtual.id) {
          alert(
            "Não foi possível identificar o registro no Airtable para edição."
          );
          return;
        }

        resp = await fetch(`/api/cartinha?id=${encodeURIComponent(registroAtual.id)}`, {
          method: "PATCH",
          body: formData,
        });
        json = await resp.json();
        console.log("PATCH /api/cartinha:", json);

        if (!json.sucesso) {
          alert("❌ Erro ao atualizar a cartinha no Airtable.");
          return;
        }

        cartinhasSessao[editIndex] = {
          ...cartinhasSessao[editIndex],
          ...payload,
          imagem_cartinha: urlImagemParaSalvar,
        };
        alert("✅ Cartinha atualizada com sucesso!");
      }

      // Limpa estado de edição
      editIndex = null;
      form.reset();
      uploadedUrl = "";
      previewImagem.innerHTML = "";
      atualizarLista();
    } catch (err) {
      console.error("Erro ao chamar /api/cartinha:", err);
      alert("❌ Erro inesperado ao salvar a cartinha.");
    }
  });

  // Botão limpar
  btnLimpar.addEventListener("click", () => {
    editIndex = null;
    form.reset();
    uploadedUrl = "";
    previewImagem.innerHTML = "";
  });

  atualizarLista();
});

// ============================================================
// 📋 LISTA DE CONFERÊNCIA
// ============================================================
function atualizarLista() {
  const lista = document.getElementById("cartinhas-lista");
  const total = document.getElementById("total-cartinhas");

  if (!cartinhasSessao.length) {
    lista.innerHTML =
      '<p class="text-center text-gray-500">Nenhuma cartinha cadastrada nesta sessão.</p>';
    total.textContent = "0";
    return;
  }

  total.textContent = cartinhasSessao.length;

  lista.innerHTML = cartinhasSessao
    .map(
      (c, idx) => `
      <div class="p-4 border rounded-lg bg-blue-50 shadow-sm relative">

        ${
          c.imagem_cartinha
            ? `<img src="${c.imagem_cartinha}" class="w-28 h-28 object-cover rounded-lg float-right ml-3 border shadow">`
            : ""
        }

        <p><strong>Nome:</strong> ${c.nome_crianca}</p>
        <p><strong>Idade:</strong> ${c.idade}</p>
        <p><strong>Sexo:</strong> ${c.sexo}</p>
        <p><strong>Irmãos:</strong> ${c.irmaos || "0"}</p>
        <p><strong>Idade dos Irmãos:</strong> ${c.idade_irmaos || "-"}</p>
        <p><strong>Escola:</strong> ${c.escola || "-"}</p>
        <p><strong>Cidade:</strong> ${c.cidade}</p>
        <p><strong>Telefone:</strong> ${c.telefone_contato}</p>
        <p><strong>Psicóloga:</strong> ${c.psicologa_responsavel || "-"}</p>
        <p><strong>Sonho:</strong> ${c.sonho}</p>
        <p><strong>Status:</strong> ${c.status}</p>

        <div class="flex gap-3 mt-3">
          <button onclick="editarCartinha(${idx})"
            class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow">
            ✏️ Editar
          </button>

          <button onclick="excluirCartinha(${idx})"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow">
            🗑️ Excluir
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// ============================================================
// ✏️ EDITAR CARTINHA (carrega para o formulário)
// ============================================================
function editarCartinha(idx) {
  const c = cartinhasSessao[idx];
  if (!c) return;

  const form = document.getElementById("form-cartinha");
  const previewImagem = document.getElementById("preview-imagem");

  form.nome_crianca.value = c.nome_crianca;
  form.idade.value = c.idade;
  form.sexo.value = c.sexo;
  form.irmaos.value = c.irmaos;
  form.idade_irmaos.value = c.idade_irmaos;
  form.escola.value = c.escola;
  form.cidade.value = c.cidade;
  form.telefone_contato.value = c.telefone_contato;
  form.psicologa_responsavel.value = c.psicologa_responsavel;
  form.sonho.value = c.sonho;
  form.observacoes_admin.value = c.observacoes_admin;
  form.status.value = c.status;

  uploadedUrl = c.imagem_cartinha || "";
  previewImagem.innerHTML = uploadedUrl
    ? `<img src="${uploadedUrl}" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`
    : "";

  editIndex = idx;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// 🗑️ EXCLUIR CARTINHA (sessão + Airtable)
// ============================================================
async function excluirCartinha(idx) {
  const c = cartinhasSessao[idx];
  if (!c) return;

  if (!confirm("Tem certeza que deseja excluir esta cartinha?")) return;

  try {
    if (c.id) {
      const resp = await fetch(`/api/cartinha?id=${encodeURIComponent(c.id)}`, {
        method: "DELETE",
      });
      const json = await resp.json();
      console.log("DELETE /api/cartinha:", json);

      if (!json.sucesso) {
        alert("❌ Erro ao excluir a cartinha no Airtable.");
        return;
      }
    }

    // Remove da lista local
    cartinhasSessao.splice(idx, 1);
    if (editIndex === idx) editIndex = null;
    atualizarLista();
    alert("🗑️ Cartinha excluída com sucesso!");
  } catch (err) {
    console.error("Erro ao excluir cartinha:", err);
    alert("❌ Erro inesperado ao excluir a cartinha.");
  }
}
