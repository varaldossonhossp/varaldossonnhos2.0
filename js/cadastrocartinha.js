// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js
// ------------------------------------------------------------
// - Cadastro/edição de cartinhas no painel admin
// - Envio para /api/cartinha (Airtable)
// - Upload da imagem via Cloudinary (URL pública)
// - Máscara de telefone
// - Primeira letra maiúscula nos campos de nome/cidade/escola
// ============================================================

// ⚠️ Preencha com os dados REAIS do seu Cloudinary
const CLOUD_NAME = "SEU_CLOUD_NAME";
const UPLOAD_PRESET = "SEU_UPLOAD_PRESET";

let uploadedUrl = "";      // URL retornada pelo Cloudinary
let cartinhas = [];        // Lista usada para exibir no painel
let editIndex = null;      // Índice na lista (edição local)

// ------------------------------------------------------------
// Utilitário: primeira letra maiúscula de cada palavra
// ------------------------------------------------------------
function titleCase(str = "") {
  return str
    .toLowerCase()
    .replace(/(^|\s)([a-záéíóúâêôãõç])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}

// ------------------------------------------------------------
// Atualiza lista visual de cartinhas
// ------------------------------------------------------------
function atualizarLista() {
  const lista = document.getElementById("cartinhas-lista");
  const total = document.getElementById("total-cartinhas");

  if (!cartinhas || cartinhas.length === 0) {
    lista.innerHTML =
      '<p class="text-center text-slate-500">Nenhuma cartinha cadastrada ainda.</p>';
    total.textContent = 0;
    return;
  }

  total.textContent = cartinhas.length;

  lista.innerHTML = cartinhas
    .map(
      (c, index) => `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-semibold text-slate-900">
              ${c.nome_crianca || "Sem nome"}
            </p>
            <p class="text-sm text-slate-600">
              ${c.idade ? `${c.idade} anos · ` : ""}${c.sexo || ""}
            </p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full ${
            c.status === "adotada"
              ? "bg-pink-100 text-pink-700"
              : c.status === "inativa"
              ? "bg-slate-200 text-slate-700"
              : "bg-green-100 text-green-700"
          }">
            ${c.status || "—"}
          </span>
        </div>

        ${
          c.sonho
            ? `<p class="mt-2 text-sm text-slate-700"><strong>Sonho:</strong> ${c.sonho}</p>`
            : ""
        }
        ${
          c.escola
            ? `<p class="mt-1 text-xs text-slate-500"><strong>Escola:</strong> ${c.escola}</p>`
            : ""
        }

        <div class="mt-3 flex gap-3">
          <button onclick="editar(${index})"
                  class="px-3 py-1 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 transition">
            ✏️ Editar (local)
          </button>
          <button onclick="excluir(${index})"
                  class="px-3 py-1 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition">
            🗑️ Remover da lista
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// ------------------------------------------------------------
// Envia cartinha para a API (Airtable)
// ------------------------------------------------------------
async function salvarNoAirtable(cartinha) {
  try {
    const formData = new FormData();

    // Campos simples
    Object.keys(cartinha).forEach((key) => {
      if (key !== "imagem_cartinha") {
        if (cartinha[key] !== undefined && cartinha[key] !== null) {
          formData.append(key, cartinha[key]);
        }
      }
    });

    // Campo de imagem (JSON string para o backend)
    const imagens = uploadedUrl
      ? [{ url: uploadedUrl }]
      : []; // pode ficar vazio

    formData.append("imagem_cartinha", JSON.stringify(imagens));

    const resp = await fetch("/api/cartinha", {
      method: "POST",
      body: formData,
    });

    const json = await resp.json();
    console.log("📡 Resposta /api/cartinha:", json);

    if (!resp.ok || !json.sucesso) {
      alert("❌ Erro ao salvar a cartinha no Airtable.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao salvar no Airtable:", error);
    alert("❌ Erro ao salvar a cartinha no Airtable.");
    return false;
  }
}

// ------------------------------------------------------------
// Carrega cartinhas já existentes (GET /api/cartinha)
// ------------------------------------------------------------
async function carregarCartinhas() {
  try {
    const resp = await fetch("/api/cartinha");
    const json = await resp.json();

    if (resp.ok && json.sucesso && Array.isArray(json.cartinha)) {
      cartinhas = json.cartinha;
    } else {
      cartinhas = [];
    }
  } catch (e) {
    console.warn("Não foi possível carregar cartinhas:", e);
    cartinhas = [];
  }

  atualizarLista();
}

// ------------------------------------------------------------
// Eventos de formulário
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cartinha");
  const btnLimpar = document.getElementById("btn-limpar");
  const previewImagem = document.getElementById("preview-imagem");
  const inputTelefone = document.getElementById("telefone_contato");

  // Carrega dados iniciais
  carregarCartinhas();

  // Máscara de telefone
  if (inputTelefone) {
    inputTelefone.addEventListener("input", (e) => {
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
  }

  // Primeira letra maiúscula em alguns campos
  const camposTitleCase = [
    "nome_crianca",
    "escola",
    "cidade",
    "psicologa_responsavel",
  ];
  camposTitleCase.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("blur", () => {
        el.value = titleCase(el.value);
      });
    }
  });

  // Upload Cloudinary
  form.imagem_cartinha.addEventListener("change", async () => {
    const file = form.imagem_cartinha.files[0];
    if (!file) {
      uploadedUrl = "";
      previewImagem.innerHTML = "Nenhum arquivo selecionado.";
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
      console.log("📨 Resposta Cloudinary:", data);

      if (resp.ok && data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `
          <img src="${uploadedUrl}" alt="Prévia" 
               class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto"
               style="max-width:150px;">
        `;
      } else {
        uploadedUrl = "";
        previewImagem.innerHTML =
          '<p class="text-red-500">❌ Falha no upload da imagem.</p>';
      }
    } catch (err) {
      console.error("Erro Cloudinary:", err);
      uploadedUrl = "";
      previewImagem.innerHTML =
        '<p class="text-red-500">❌ Erro ao enviar imagem.</p>';
    }
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Garante título-caso antes de enviar
    form.nome_crianca.value = titleCase(form.nome_crianca.value);
    form.escola.value = titleCase(form.escola.value);
    form.cidade.value = titleCase(form.cidade.value);
    form.psicologa_responsavel.value = titleCase(
      form.psicologa_responsavel.value
    );

    const novaCartinha = {
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
      // id_evento poderia ser adicionado no futuro, se tiver select de evento
    };

    const sucesso = await salvarNoAirtable(novaCartinha);
    if (!sucesso) return;

    // Atualiza lista localmente
    if (editIndex === null) {
      cartinhas.push(novaCartinha);
    } else {
      cartinhas[editIndex] = novaCartinha;
      editIndex = null;
    }

    atualizarLista();
    form.reset();
    uploadedUrl = "";
    previewImagem.innerHTML = "Nenhum arquivo selecionado.";
    alert("✅ Cartinha salva com sucesso!");
  });

  // Botão limpar
  btnLimpar.addEventListener("click", () => {
    form.reset();
    uploadedUrl = "";
    previewImagem.innerHTML = "Nenhum arquivo selecionado.";
    editIndex = null;
  });
});

// ------------------------------------------------------------
// Funções de edição/remoção (apenas na lista local)
// ------------------------------------------------------------
function editar(i) {
  const c = cartinhas[i];
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

  editIndex = i;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluir(i) {
  if (!confirm("Remover apenas da lista de conferência?")) return;
  cartinhas.splice(i, 1);
  atualizarLista();
}
