// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastrocartinha.js
// ------------------------------------------------------------
// - Cadastro de cartinhas pelo painel admin
// - Upload de imagem via Cloudinary (unsigned)
// - Máscara de telefone
// - Primeira letra maiúscula (Title Case)
// - Lista de conferência com foto + editar + excluir
// - Envio correto para /api/cartinha (form-data)
// ============================================================

// 🌥 Configuração Cloudinary
const CLOUD_NAME = "drnn5zmxi";
const UPLOAD_PRESET = "unsigned_uploads";

let uploadedUrl = "";
let cartinhasSessao = [];
let cadastroSessaoId = null;

// ============================================================
// Inicialização
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cartinha");
  const previewImagem = document.getElementById("preview-imagem");
  const btnLimpar = document.getElementById("btn-limpar");

  // ID da sessão (só para controle interno)
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
        previewImagem.innerHTML =
          '<p class="text-red-500">❌ Falha no upload.</p>';
      }
    } catch (err) {
      console.error("Erro Cloudinary:", err);
      previewImagem.innerHTML =
        '<p class="text-red-500">Erro ao enviar imagem.</p>';
    }
  });

  // ============================================================
  // 📨 ENVIO PARA API (/api/cartinha)
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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

    // Foto → attachment
    payload.imagem_cartinha = uploadedUrl
      ? JSON.stringify([{ url: uploadedUrl }])
      : JSON.stringify([]);

    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

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

      // Adiciona à lista da sessão
      cartinhasSessao.push({
        ...payload,
        imagem_cartinha: uploadedUrl,
      });

      atualizarLista();

      form.reset();
      uploadedUrl = "";
      previewImagem.innerHTML = "";
    } catch (err) {
      console.error("Erro ao chamar API:", err);
      alert("❌ Erro inesperado ao salvar a cartinha.");
    }
  });

  // Botão limpar
  btnLimpar.addEventListener("click", () => {
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
        <p><strong>Irmãos:</strong> ${c.irmaos || "-"}</p>
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
// ✏️ EDITAR CARTINHA
// ============================================================
function editarCartinha(idx) {
  const c = cartinhasSessao[idx];

  document.getElementById("nome_crianca").value = c.nome_crianca;
  document.getElementById("idade").value = c.idade;
  document.getElementById("sexo").value = c.sexo;
  document.getElementById("irmaos").value = c.irmaos;
  document.getElementById("idade_irmaos").value = c.idade_irmaos;
  document.getElementById("escola").value = c.escola;
  document.getElementById("cidade").value = c.cidade;
  document.getElementById("telefone_contato").value = c.telefone_contato;
  document.getElementById("psicologa_responsavel").value = c.psicologa_responsavel;
  document.getElementById("sonho").value = c.sonho;
  document.getElementById("observacoes_admin").value = c.observacoes_admin;
  document.getElementById("status").value = c.status;

  alert("✏️ Cartinha carregada no formulário para edição!");
}

// ============================================================
// 🗑️ EXCLUIR CARTINHA DA SESSÃO
// ============================================================
function excluirCartinha(idx) {
  if (confirm("Tem certeza que deseja remover esta cartinha da conferência?")) {
    cartinhasSessao.splice(idx, 1);
    atualizarLista();
  }
}
