// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js
// ------------------------------------------------------------
// Tela interna de cadastro de cartinhas (admin):
//  • Upload da imagem via Cloudinary (URL pública)
//  • Envio via FormData → /api/cartinha (POST)
//  • Sessão de cadastro (cadastro_sessao_id) para filtro
//  • Lista local apenas para conferência (não edita no Airtable)
// ============================================================

// 🔧 Configurações Cloudinary (ajuste para o seu projeto)
const CLOUD_NAME = window.CLOUDINARY_CLOUD_NAME || "SEU_CLOUD_NAME";
const UPLOAD_PRESET =
  window.CLOUDINARY_UPLOAD_PRESET || "SEU_UPLOAD_PRESET_CARTINHAS";

// API
const API_CARTINHA = "/api/cartinha";

// Lista em memória (somente para conferência na tela)
let cartinhasLocal = [];
let editIndex = null;
let uploadedUrl = ""; // URL da imagem enviada para o Cloudinary

// 🔐 Sessão de cadastro (para agrupar as cartinhas desta tela)
function obterSessaoCadastro() {
  let sessao = localStorage.getItem("vs_cadastro_sessao_id");
  if (!sessao) {
    sessao = `sessao-${Date.now()}`;
    localStorage.setItem("vs_cadastro_sessao_id", sessao);
  }
  return sessao;
}

// ============================================================
// 🧩 Atualiza lista visual
// ============================================================
function atualizarLista() {
  const lista = document.getElementById("cartinhas-lista");
  const totalSpan = document.getElementById("total-cartinhas");

  if (!cartinhasLocal.length) {
    lista.innerHTML =
      '<p class="text-center text-gray-500">Nenhuma cartinha cadastrada nesta sessão ainda.</p>';
    totalSpan.textContent = "0";
    return;
  }

  totalSpan.textContent = String(cartinhasLocal.length);

  lista.innerHTML = cartinhasLocal
    .map(
      (c, index) => `
      <div class="p-4 border rounded-lg shadow-sm bg-blue-50">
        <div class="flex flex-wrap justify-between gap-2">
          <p><strong>Nome:</strong> ${c.nome_crianca}</p>
          <p><strong>Idade:</strong> ${c.idade}</p>
          <p><strong>Sexo:</strong> ${c.sexo}</p>
        </div>
        <p class="mt-1"><strong>Sonho:</strong> ${c.sonho || "—"}</p>
        <p class="mt-1 text-sm text-gray-600">
          <strong>Irmãos:</strong> ${c.irmaos || "0"} | 
          <strong>Idades dos irmãos:</strong> ${c.idade_irmaos || "—"}
        </p>
        <p class="mt-1 text-sm text-gray-600">
          <strong>Escola:</strong> ${c.escola || "—"} | 
          <strong>Cidade:</strong> ${c.cidade || "—"}
        </p>
        <p class="mt-1 text-sm text-gray-600">
          <strong>Status:</strong> ${c.status}
        </p>

        <div class="mt-3 flex gap-3">
          <button onclick="editarCartinha(${index})"
            class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm">
            ✏️ Editar (somente na tela)
          </button>
          <button onclick="excluirCartinha(${index})"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
            🗑️ Remover da lista
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// ============================================================
// 💾 Envia cartinha para Airtable via /api/cartinha (POST)
// ============================================================
async function salvarNoAirtable(cartinha) {
  try {
    const formData = new FormData();
    Object.entries(cartinha).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Chamando a rota já existente
    const resp = await fetch(API_CARTINHA, {
      method: "POST",
      body: formData,
    });

    const json = await resp.json();

    if (!resp.ok || !json.sucesso) {
      console.error("Erro ao salvar no Airtable:", json);
      alert("❌ Erro ao salvar a cartinha no Airtable.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao chamar /api/cartinha:", error);
    alert("❌ Erro de comunicação com o servidor.");
    return false;
  }
}

// ============================================================
// 📤 Upload da imagem no Cloudinary
// ============================================================
function configurarUploadCloudinary() {
  const form = document.getElementById("form-cartinha");
  const inputImagem = document.getElementById("imagem_cartinha");
  const previewImagem = document.getElementById("preview-imagem");

  inputImagem.addEventListener("change", async () => {
    const file = inputImagem.files[0];
    if (!file) {
      uploadedUrl = "";
      previewImagem.innerHTML = "";
      return;
    }

    previewImagem.innerHTML =
      '<p class="text-blue-600">⏳ Enviando imagem...</p>';

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);

      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await resp.json();

      if (data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `
          <img src="${uploadedUrl}" alt="Prévia da cartinha"
               class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto"
               style="max-width: 150px;">
        `;
      } else {
        console.error("Resposta Cloudinary:", data);
        uploadedUrl =
          "";
        previewImagem.innerHTML =
          '<p class="text-red-500">❌ Falha no upload da imagem.</p>';
      }
    } catch (err) {
      console.error("Erro no upload Cloudinary:", err);
      uploadedUrl = "";
      previewImagem.innerHTML =
        '<p class="text-red-500">❌ Erro ao enviar imagem.</p>';
    }
  });
}

// ============================================================
// 📝 SUBMIT DO FORMULÁRIO
// ============================================================
function configurarFormulario() {
  const form = document.getElementById("form-cartinha");
  const btnLimpar = document.getElementById("btn-limpar");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sessao = obterSessaoCadastro();

    const cartinha = {
      nome_crianca: form.nome_crianca.value.trim(),
      idade: form.idade.value.trim(),
      sexo: form.sexo.value,
      irmaos: form.irmaos.value.trim(),
      idade_irmaos: form.idade_irmaos.value.trim(),
      sonho: form.sonho.value.trim(),
      escola: form.escola.value.trim(),
      cidade: form.cidade.value.trim(),
      telefone_contato: form.telefone_contato.value.trim(),
      psicologa_responsavel: form.psicologa_responsavel.value.trim(),
      observacoes_admin: form.observacoes_admin.value.trim(),
      status: form.status.value,
      cadastro_sessao_id: sessao,
      // Imagem no formato que a API já espera: array JSON de anexos
      imagem_cartinha: uploadedUrl
        ? JSON.stringify([{ url: uploadedUrl }])
        : JSON.stringify([]),
    };

    if (!cartinha.nome_crianca || !cartinha.idade) {
      alert("Preencha pelo menos o nome da criança e a idade.");
      return;
    }

    const ok = await salvarNoAirtable(cartinha);
    if (!ok) return;

    // Atualiza lista local (somente visual)
    if (editIndex === null) {
      cartinhasLocal.push(cartinha);
    } else {
      cartinhasLocal[editIndex] = cartinha;
      editIndex = null;
    }

    atualizarLista();
    form.reset();
    uploadedUrl = "";
    document.getElementById("preview-imagem").innerHTML = "";
  });

  btnLimpar.addEventListener("click", () => {
    form.reset();
    editIndex = null;
    uploadedUrl = "";
    document.getElementById("preview-imagem").innerHTML = "";
  });
}

// ============================================================
// ✏️ Editar (somente na tela, NÃO altera Airtable)
// ============================================================
window.editarCartinha = function (i) {
  const c = cartinhasLocal[i];
  if (!c) return;

  const form = document.getElementById("form-cartinha");
  form.nome_crianca.value = c.nome_crianca || "";
  form.idade.value = c.idade || "";
  form.sexo.value = c.sexo || "menino";
  form.irmaos.value = c.irmaos || "";
  form.idade_irmaos.value = c.idade_irmaos || "";
  form.sonho.value = c.sonho || "";
  form.escola.value = c.escola || "";
  form.cidade.value = c.cidade || "";
  form.telefone_contato.value = c.telefone_contato || "";
  form.psicologa_responsavel.value = c.psicologa_responsavel || "";
  form.observacoes_admin.value = c.observacoes_admin || "";
  form.status.value = c.status || "disponivel";

  // Imagem: não reabre o arquivo, mas mostra a prévia se tiver URL
  const preview = document.getElementById("preview-imagem");
  if (c.imagem_cartinha && uploadedUrl) {
    preview.innerHTML = `
      <img src="${uploadedUrl}" alt="Prévia da cartinha"
           class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto"
           style="max-width: 150px;">
    `;
  } else {
    preview.innerHTML = "";
  }

  editIndex = i;
};

// ============================================================
// 🗑️ Excluir da lista (somente visual)
// ============================================================
window.excluirCartinha = function (i) {
  if (!confirm("Remover esta cartinha apenas da lista de conferência da tela?")) {
    return;
  }
  cartinhasLocal.splice(i, 1);
  atualizarLista();
};

// ============================================================
// 🚀 Inicialização
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  configurarUploadCloudinary();
  configurarFormulario();
  atualizarLista();
});
