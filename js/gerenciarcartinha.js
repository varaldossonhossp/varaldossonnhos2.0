// ============================================================
// 💙 VARAL DOS SONHOS — js/gerenciarcartinha.js
// ------------------------------------------------------------
// 🔹 Gerencia o cadastro e edição de cartinhas (admin)
// 🔹 Busca eventos ativos para vincular
// 🔹 Faz upload de imagem (Cloudinary) e salva link no Airtable
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("form-cartinha");
  const campoEvento = document.getElementById("evento");
  const inputImagem = document.getElementById("imagem_cartinha");
  const preview = document.getElementById("preview");
  let eventoSelecionado = null;

  // ============================================================
  // 🔹 Carregar lista de eventos ativos
  // ============================================================
  async function carregarEventos() {
    const resp = await fetch("/api/eventos?tipo=admin");
    const json = await resp.json();

    if (json?.sucesso && json.eventos.length) {
      campoEvento.innerHTML = json.eventos
        .map(
          (e) =>
            `<option value="${e.id}">${e.nome_evento} — ${e.data_evento || ""}</option>`
        )
        .join("");
      eventoSelecionado = json.eventos[0].id;
    } else {
      campoEvento.innerHTML = `<option value="">Nenhum evento ativo</option>`;
    }
  }

  await carregarEventos();

  // ============================================================
  // 🔹 Upload de imagem para Cloudinary
  // ============================================================
  inputImagem.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "varaldossonhos");

    const resp = await fetch("https://api.cloudinary.com/v1_1/dytlm3v8b/image/upload", {
      method: "POST",
      body: data,
    });

    const json = await resp.json();
    if (json.secure_url) {
      preview.src = json.secure_url;
      preview.style.display = "block";
      inputImagem.dataset.url = json.secure_url;
    }
  });

  // ============================================================
  // 🔹 Enviar formulário (criar cartinha)
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("imagem_cartinha", JSON.stringify([{ url: inputImagem.dataset.url }]));
    formData.append("evento_id", campoEvento.value || eventoSelecionado);

    const resp = await fetch("/api/cartinha", {
      method: "POST",
      body: formData,
    });

    const json = await resp.json();
    if (json.sucesso) {
      alert("✅ Cartinha cadastrada com sucesso!");
      form.reset();
      preview.style.display = "none";
    } else {
      alert("❌ Erro: " + json.mensagem);
    }
  });
});
