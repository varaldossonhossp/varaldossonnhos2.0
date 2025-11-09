// ============================================================
// 💌 VARAL DOS SONHOS — Gerenciar Cartinhas (versão final TCC)
// ------------------------------------------------------------
// 🔹 Upload automático via Cloudinary (unsigned preset)
// 🔹 Envio ao Airtable por API local (/api/cartinha)
// 🔹 Ajuste pontual: envia imagem_cartinha como string JSON
// 🔹 Validação reforçada para campos Single Select (sexo, status)
// ============================================================

(() => {
  const API_URL = "../api/cartinha";
  const CLOUD_NAME = "drnn5zmxi";
  const UPLOAD_PRESET = "unsigned_uploads";

  const listaCartinhasBody = document.querySelector("#lista-cartinhas-body");
  const totalCartinhasSpan = document.querySelector("#total-cartinhas");
  const form = document.querySelector("#form-cartinha");
  const previewImagem = document.querySelector("#preview-imagem");

  let editandoId = null;
  let uploadedUrl = "";

  // ============================================================
  // 🔹 Cor do status (visuais)
  // ============================================================
  function getStatusColor(status) {
    if (!status) return "bg-gray-400";
    const s = status.toLowerCase();
    if (s === "disponivel") return "bg-green-500";
    if (s === "adotada") return "bg-yellow-500";
    if (s === "inativa") return "bg-gray-400";
    return "bg-blue-500";
  }

  // ============================================================
  // 🔹 Upload Cloudinary — unsigned preset
  // ============================================================
  form.imagem_cartinha.addEventListener("change", async () => {
    const file = form.imagem_cartinha.files[0];
    if (!file) return (previewImagem.innerHTML = "");

    previewImagem.innerHTML = `<p class="text-blue-600">⏳ Enviando imagem...</p>`;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (data.secure_url) {
        uploadedUrl = data.secure_url;
        previewImagem.innerHTML = `
          <img src="${uploadedUrl}" alt="Pré-visualização"
               class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto"
               style="max-width: 150px;">
        `;
      } else {
        previewImagem.innerHTML = `<p class="text-red-500">❌ Falha no upload.</p>`;
      }
    } catch (err) {
      console.error("Erro no upload Cloudinary:", err);
      previewImagem.innerHTML = `<p class="text-red-500">Erro ao enviar imagem.</p>`;
    }
  });

  // ============================================================
  // 🔹 Enviar formulário (POST ou PATCH)
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✅ Validação pontual — impede erro INVALID_MULTIPLE_CHOICE_OPTIONS
    const sexoValido = ["menino", "menina", "outro"];
    const statusValido = ["disponivel", "adotada", "inativa"];

    const sexoInput = form.sexo.value.trim().toLowerCase();
    const statusInput = form.status.value.trim().toLowerCase();

    const dados = {
      nome_crianca: form.nome_crianca.value.trim(),
      idade: parseInt(form.idade.value) || null,
      sexo: sexoValido.includes(sexoInput) ? sexoInput : "menino",
      sonho: form.sonho.value.trim(),
      escola: form.escola.value.trim(),
      cidade: form.cidade.value.trim(),
      psicologa_responsavel: form.psicologa_responsavel.value.trim(),
      telefone_contato: form.telefone_contato.value.trim(),
      status: statusValido.includes(statusInput) ? statusInput : "disponivel",

      // ⚙️ 🔹 AJUSTE PONTUAL:
      // Agora a imagem é enviada como string JSON para o back-end Cloudinary (API cartinha)
      imagem_cartinha: uploadedUrl
        ? JSON.stringify([{ url: uploadedUrl }])
        : JSON.stringify([]),
    };

    try {
      const metodo = editandoId ? "PATCH" : "POST";
      const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;

      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert(editandoId ? "Cartinha atualizada com sucesso!" : "Cartinha criada com sucesso!");
        form.reset();
        previewImagem.innerHTML = "";
        uploadedUrl = "";
        editandoId = null;
        carregarCartinhas();
      } else {
        alert("Erro ao salvar: " + resultado.mensagem);
      }
    } catch (err) {
      console.error("Erro ao salvar cartinha:", err);
      alert("Erro ao salvar cartinha.");
    }
  });

  // ============================================================
  // 🔹 Carregar, editar e excluir (inalterados)
  // ============================================================
  async function carregarCartinhas() {
    listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Carregando...</p>`;
    totalCartinhasSpan.textContent = "0";

    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();
      const cartinhas = dados.cartinha || [];

      if (!dados.sucesso || cartinhas.length === 0) {
        listaCartinhasBody.innerHTML = `<p class="text-center text-gray-500 py-4">Nenhuma cartinha cadastrada.</p>`;
        return;
      }

      totalCartinhasSpan.textContent = cartinhas.length;
      listaCartinhasBody.innerHTML = "";

      cartinhas.forEach((c) => {
        const imgUrl =
          Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
            ? c.imagem_cartinha[0].url
            : "../imagens/cartinha-padrao.png";

        const card = document.createElement("div");
        card.className =
          "p-4 border border-blue-200 rounded-xl shadow-md bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center";

        card.innerHTML = `
          <div class="flex items-center gap-4 w-full lg:w-3/4">
            <img src="${imgUrl}" alt="Cartinha" class="w-16 h-16 object-cover rounded-full border-2 border-blue-400">
            <div class="flex-1">
              <p class="text-lg font-semibold text-gray-800">${c.nome_crianca} (${c.idade} anos, ${c.sexo})</p>
              <p class="text-sm text-gray-600 truncate">🎁 Sonho: ${c.sonho}</p>
              <p class="text-xs text-gray-500 mt-1">🏫 ${c.escola} — ${c.cidade}</p>
              <p class="text-xs text-gray-500">👩‍🏫 ${c.psicologa_responsavel} (${c.telefone_contato})</p>
            </div>
          </div>
          <div class="flex flex-col space-y-2 lg:w-1/4 lg:text-right w-full mt-4 lg:mt-0">
            <span class="text-xs font-medium px-3 py-1 rounded-full text-white ${getStatusColor(c.status)}">
              ${(c.status || "").toUpperCase()}
            </span>
            <div class="flex gap-2 justify-start lg:justify-end mt-2">
              <button data-id="${c.id}" class="btn-editar bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-1 px-3 rounded">Editar</button>
              <button data-id="${c.id}" class="btn-excluir bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded">Excluir</button>
            </div>
          </div>
        `;

        card.querySelector(".btn-editar").addEventListener("click", () => editarCartinha(c.id));
        card.querySelector(".btn-excluir").addEventListener("click", () => excluirCartinha(c.id));

        listaCartinhasBody.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar cartinhas:", err);
      listaCartinhasBody.innerHTML = `<p class="text-center text-red-500 py-4">Erro ao carregar cartinhas.</p>`;
    }
  }

  async function editarCartinha(id) {
    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();
      const c = dados.cartinha.find((x) => x.id === id);
      if (!c) return alert("Cartinha não encontrada.");

      editandoId = id;
      form.nome_crianca.value = c.nome_crianca;
      form.idade.value = c.idade;
      form.sexo.value = c.sexo;
      form.sonho.value = c.sonho;
      form.escola.value = c.escola;
      form.cidade.value = c.cidade;
      form.psicologa_responsavel.value = c.psicologa_responsavel;
      form.telefone_contato.value = c.telefone_contato;
      form.status.value = c.status;

      uploadedUrl =
        Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
          ? c.imagem_cartinha[0].url
          : "";

      previewImagem.innerHTML = uploadedUrl
        ? `<img src="${uploadedUrl}" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`
        : "";
    } catch (err) {
      alert("Erro ao carregar cartinha para edição.");
    }
  }

  async function excluirCartinha(id) {
    if (!confirm("Deseja realmente excluir esta cartinha?")) return;
    try {
      const resp = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert("Cartinha excluída!");
        carregarCartinhas();
      } else {
        alert("Erro ao excluir: " + resultado.mensagem);
      }
    } catch (err) {
      alert("Erro ao excluir cartinha.");
    }
  }

  carregarCartinhas();
})();
