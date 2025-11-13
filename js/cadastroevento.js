// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastroevento.js
// ------------------------------------------------------------
// - Cadastro e edição de eventos (painel admin)
// - Upload de imagens via Cloudinary (múltiplas fotos)
// - Integração com /api/admin.js (token administrativo)
// - Campos alinhados com a tabela "eventos" do Airtable
// ============================================================

// 🔧 Config Cloudinary (unsigned upload)
const CLOUD_NAME = "drnn5zmxi";
const UPLOAD_PRESET = "unsigned_uploads";

// ⚠️ Token administrativo — deve bater com ADMIN_SECRET do Vercel
const ADMIN_TOKEN = "VARAL_ADMIN"; // ajuste se usar outro valor

let eventos = [];          // eventos carregados do Airtable
let editId = null;         // id (Airtable) do evento em edição
let imagemAttachments = []; // [{ url }]
let carregandoUpload = false;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-evento");
  const btnLimpar = document.getElementById("btn-limpar");
  const inputImagens = document.getElementById("imagens_evento");
  const previewImagens = document.getElementById("preview-imagens");

  // ==========================================================
  // 🔤 Title Case em campos de texto principais
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

  aplicaTitleCase("nome_evento");
  aplicaTitleCase("local_evento");

  // ==========================================================
  // 🖼️ Upload de várias imagens para Cloudinary
  // ==========================================================
  inputImagens.addEventListener("change", async () => {
    const files = Array.from(inputImagens.files || []);
    previewImagens.innerHTML = "";
    imagemAttachments = [];

    if (!files.length) return;

    carregandoUpload = true;
    previewImagens.innerHTML =
      '<p class="text-blue-600 w-full text-center">⏳ Enviando imagens...</p>';

    const thumbs = [];

    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);

        const resp = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: fd }
        );
        const data = await resp.json();
        console.log("Cloudinary:", data);

        if (data.secure_url) {
          imagemAttachments.push({ url: data.secure_url });
          thumbs.push(
            `<img src="${data.secure_url}" class="h-24 w-auto rounded-lg border border-blue-200 shadow-sm" alt="Imagem do evento" />`
          );
        }
      } catch (err) {
        console.error("Erro upload Cloudinary:", err);
      }
    }

    carregandoUpload = false;

    if (!imagemAttachments.length) {
      previewImagens.innerHTML =
        '<p class="text-red-500 w-full text-center">❌ Falha ao enviar imagens.</p>';
    } else {
      previewImagens.innerHTML = thumbs.join("");
    }
  });

  // ==========================================================
  // 📨 Enviar evento (criar ou atualizar)
  // ==========================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (carregandoUpload) {
      alert("⏳ Aguarde o término do upload das imagens antes de salvar.");
      return;
    }

    const payloadBase = {
      nome_evento: form.nome_evento.value.trim(),
      local_evento: form.local_evento.value.trim(),
      descricao: form.descricao.value.trim(),
      data_evento: form.data_evento.value || null,
      data_limite_recebimento: form.data_limite_recebimento.value || null,
      data_realizacao_evento: form.data_realizacao_evento.value || null,
      status_evento: form.status_evento.value,
      destacar_na_homepage: form.destacar_na_homepage.checked,
      imagem: imagemAttachments, // array de { url }
    };

    // aplica TitleCase nos campos certos
    payloadBase.nome_evento = titleCase(payloadBase.nome_evento);
    payloadBase.local_evento = titleCase(payloadBase.local_evento);

    try {
      let body;

      if (!editId) {
        // 🆕 CRIAR
        body = {
          acao: "criar",
          token_admin: ADMIN_TOKEN,
          ...payloadBase,
        };
      } else {
        // ✏️ ATUALIZAR
        body = {
          acao: "atualizar",
          token_admin: ADMIN_TOKEN,
          id_evento: editId,
          fields: payloadBase,
        };
      }

      const resp = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await resp.json();
      console.log("Resposta /api/admin:", json);

      if (!json.sucesso) {
        alert("❌ Erro ao salvar o evento: " + (json.mensagem || "Erro desconhecido."));
        return;
      }

      alert(editId ? "✅ Evento atualizado com sucesso!" : "✅ Evento cadastrado com sucesso!");

      form.reset();
      editId = null;
      imagemAttachments = [];
      previewImagens.innerHTML = "";

      await carregarEventos();
    } catch (err) {
      console.error("Erro ao chamar /api/admin:", err);
      alert("❌ Erro inesperado ao salvar o evento.");
    }
  });

  // ==========================================================
  // 🧹 Botão limpar
  // ==========================================================
  btnLimpar.addEventListener("click", () => {
    form.reset();
    editId = null;
    imagemAttachments = [];
    previewImagens.innerHTML = "";
  });

  // Carrega lista inicial
  carregarEventos();
});

// ============================================================
// 📋 Carregar eventos via /api/admin (GET)
// ============================================================
async function carregarEventos() {
  const lista = document.getElementById("eventos-lista");
  const total = document.getElementById("total-eventos");

  try {
    const resp = await fetch(`/api/admin?token_admin=${encodeURIComponent(ADMIN_TOKEN)}`);
    const json = await resp.json();
    console.log("GET /api/admin:", json);

    if (!json.sucesso) {
      lista.innerHTML =
        '<p class="text-center text-red-500">Erro ao carregar eventos.</p>';
      total.textContent = "0";
      return;
    }

    eventos = (json.eventos || []).map((r) => {
      const f = r.fields || {};
      return {
        id: r.id,
        nome_evento: f.nome_evento || "",
        local_evento: f.local_evento || "",
        descricao: f.descricao || "",
        data_evento: f.data_evento || "",
        data_limite_recebimento: f.data_limite_recebimento || "",
        data_realizacao_evento: f.data_realizacao_evento || "",
        status_evento: f.status_evento || "",
        destacar_na_homepage: !!f.destacar_na_homepage,
        imagem: Array.isArray(f.imagem) ? f.imagem : [],
      };
    });

    if (!eventos.length) {
      lista.innerHTML =
        '<p class="text-center text-gray-500">Nenhum evento cadastrado ainda.</p>';
      total.textContent = "0";
      return;
    }

    total.textContent = eventos.length.toString();

    lista.innerHTML = eventos
      .map((ev, index) => {
        const statusLabel =
          ev.status_evento === "encerrado"
            ? "Encerrado"
            : ev.status_evento === "proximo"
            ? "Próximo"
            : "Em andamento";

        const destaque = ev.destacar_na_homepage ? "Sim" : "Não";

        return `
          <div class="p-4 border rounded-lg bg-blue-50 shadow-sm">
            <p><strong>Nome:</strong> ${ev.nome_evento}</p>
            <p><strong>Local:</strong> ${ev.local_evento}</p>
            <p><strong>Status:</strong> ${statusLabel}</p>
            <p><strong>Início das Adoções:</strong> ${ev.data_evento || "-"}</p>
            <p><strong>Data Limite Recebimento:</strong> ${ev.data_limite_recebimento || "-"}</p>
            <p><strong>Data do Evento:</strong> ${ev.data_realizacao_evento || "-"}</p>
            <p><strong>Destaque na Home:</strong> ${destaque}</p>
            <p><strong>Imagens:</strong> ${ev.imagem.length} arquivo(s)</p>
            <p class="mt-1"><strong>Descrição:</strong> ${ev.descricao}</p>

            <div class="mt-3 flex gap-3">
              <button onclick="editarEvento(${index})"
                      class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded flex items-center gap-1">
                ✏️ <span>Editar</span>
              </button>
              <button onclick="excluirEvento(${index})"
                      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1">
                🗑️ <span>Excluir</span>
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Erro carregar eventos:", err);
    lista.innerHTML =
      '<p class="text-center text-red-500">Erro ao carregar eventos.</p>';
    total.textContent = "0";
  }
}

// ============================================================
// ✏️ Editar evento (preenche o formulário)
// ============================================================
function editarEvento(index) {
  const ev = eventos[index];
  if (!ev) return;

  const form = document.getElementById("form-evento");
  const previewImagens = document.getElementById("preview-imagens");

  editId = ev.id;

  form.nome_evento.value = ev.nome_evento;
  form.local_evento.value = ev.local_evento;
  form.descricao.value = ev.descricao;
  form.data_evento.value = ev.data_evento || "";
  form.data_limite_recebimento.value = ev.data_limite_recebimento || "";
  form.data_realizacao_evento.value = ev.data_realizacao_evento || "";
  form.status_evento.value = ev.status_evento || "em andamento";
  form.destacar_na_homepage.checked = !!ev.destacar_na_homepage;

  // imagens já existentes (vêm do Airtable)
  imagemAttachments = (ev.imagem || []).map((img) => ({ url: img.url }));
  if (imagemAttachments.length) {
    previewImagens.innerHTML = ev.imagem
      .map(
        (img) =>
          `<img src="${img.url}" class="h-24 w-auto rounded-lg border border-blue-200 shadow-sm" alt="Imagem do evento" />`
      )
      .join("");
  } else {
    previewImagens.innerHTML =
      '<p class="text-gray-500 w-full text-center">Nenhuma imagem cadastrada para este evento.</p>';
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// 🗑️ Excluir evento
// ============================================================
async function excluirEvento(index) {
  const ev = eventos[index];
  if (!ev) return;

  if (
    !confirm(
      `Tem certeza que deseja excluir o evento "${ev.nome_evento}"? Essa ação não pode ser desfeita.`
    )
  ) {
    return;
  }

  try {
    const resp = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "excluir",
        token_admin: ADMIN_TOKEN,
        id_evento: ev.id,
      }),
    });

    const json = await resp.json();
    console.log("Excluir /api/admin:", json);

    if (!json.sucesso) {
      alert("❌ Erro ao excluir o evento: " + (json.mensagem || "Erro desconhecido."));
      return;
    }

    alert("🗑️ Evento excluído com sucesso!");
    await carregarEventos();
  } catch (err) {
    console.error("Erro ao excluir evento:", err);
    alert("❌ Erro inesperado ao excluir o evento.");
  }
}
