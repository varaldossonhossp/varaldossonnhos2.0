// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js
// ------------------------------------------------------------
// - Cadastro de cartinhas pelo painel admin
// - Upload de imagem via Cloudinary (unsigned)
// - Máscara de telefone
// - Primeira letra maiúscula (Title Case) em campos de texto
// - Envio para /api/cartinha (form-data)
// ============================================================

// 🔧 Configuração Cloudinary (pública, pode ficar no front)
const CLOUD_NAME = "drnn5zmxi";
const UPLOAD_PRESET = "unsigned_uploads";

let uploadedUrl = "";           // URL retornada pelo Cloudinary
let cartinhasSessao = [];       // Lista apenas para conferência visual
let cadastroSessaoId = null;    // ID da sessão admin (pode ser usado depois)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cartinha");
  const previewImagem = document.getElementById("preview-imagem");
  const btnLimpar = document.getElementById("btn-limpar");

  // Gera um ID simples de sessão de cadastro, se ainda não existir
  cadastroSessaoId = sessionStorage.getItem("cadastro_sessao_id");
  if (!cadastroSessaoId) {
    cadastroSessaoId = "sessao-" + Date.now();
    sessionStorage.setItem("cadastro_sessao_id", cadastroSessaoId);
  }

  // ==========================================================
  // 🔤 Função para colocar Primeira Letra Maiúscula (Title Case)
  // ==========================================================
  const titleCase = (str) =>
    str
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

  function aplicaTitleCase(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      if (el.value.trim()) el.value = titleCase(el.value.trim());
    });
  }

  aplicaTitleCase("nome_crianca");
  aplicaTitleCase("escola");
  aplicaTitleCase("cidade");
  aplicaTitleCase("psicologa_responsavel");
  aplicaTitleCase("sonho");

  // ==========================================================
  // 📞 Máscara de telefone
  // ==========================================================
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

  // ==========================================================
  // 🖼️ Upload Cloudinary
  // ==========================================================
  form.imagem_cartinha.addEventListener("change", async () => {
    const file = form.imagem_cartinha.files[0];
    if (!file) {
      uploadedUrl = "";
      previewImagem.innerHTML = "";
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
        {
          method: "POST",
          body: formData,
        }
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
          '<p class="text-red-500">❌ Falha no upload da imagem.</p>';
      }
    } catch (err) {
      console.error("Erro ao enviar imagem para Cloudinary:", err);
      uploadedUrl = "";
      previewImagem.innerHTML =
        '<p class="text-red-500">Erro ao enviar imagem.</p>';
    }
  });

  // ==========================================================
  // 📨 Enviar cartinha para a API (/api/cartinha)
  // ==========================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Campos principais
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

    // Imagem da cartinha → formato de attachment do Airtable
    if (uploadedUrl) {
      payload.imagem_cartinha = JSON.stringify([{ url: uploadedUrl }]);
    } else {
      payload.imagem_cartinha = JSON.stringify([]);
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    try {
      const resp = await fetch("/api/cartinha", {
        method: "POST",
        body: formData,
      });

      const json = await resp.json();
      console.log("Resposta /api/cartinha:", json);

      if (!json.sucesso) {
        alert("❌ Erro ao salvar a cartinha no Airtable.");
        return;
      }

      alert("💙 Cartinha cadastrada com sucesso!");

      // Guarda na lista local (apenas conferência da sessão)
      cartinhasSessao.push({
        nome_crianca: payload.nome_crianca,
        idade: payload.idade,
        sexo: payload.sexo,
        sonho: payload.sonho,
        status: payload.status,
      });
      atualizarLista();

      form.reset();
      uploadedUrl = "";
      previewImagem.innerHTML = "";
    } catch (err) {
      console.error("Erro ao chamar /api/cartinha:", err);
      alert("❌ Erro inesperado ao salvar a cartinha.");
    }
  });

  // ==========================================================
  // 🧹 Botão limpar
  // ==========================================================
  btnLimpar.addEventListener("click", () => {
    form.reset();
    uploadedUrl = "";
    previewImagem.innerHTML = "";
  });

  // Primeira atualização da lista
  atualizarLista();
});

// ============================================================
// 📋 Lista visual de cartinhas da sessão
// ============================================================
function atualizarLista() {
  const lista = document.getElementById("cartinhas-lista");
  const total = document.getElementById("total-cartinhas");

  if (!cartinhasSessao || cartinhasSessao.length === 0) {
    lista.innerHTML =
      '<p class="text-center text-gray-500">Nenhuma cartinha cadastrada nesta sessão.</p>';
    total.textContent = "0";
    return;
  }

  total.textContent = cartinhasSessao.length.toString();

  lista.innerHTML = cartinhasSessao
    .map(
      (c) => `
      <div class="p-4 border rounded-lg bg-blue-50 shadow-sm">
        <p><strong>Nome:</strong> ${c.nome_crianca}</p>
        <p><strong>Idade:</strong> ${c.idade}</p>
        <p><strong>Sexo:</strong> ${c.sexo}</p>
        <p><strong>Sonho:</strong> ${c.sonho}</p>
        <p><strong>Status:</strong> ${c.status}</p>
      </div>
    `
    )
    .join("");
}
