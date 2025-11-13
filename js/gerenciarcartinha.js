// ============================================================
// 💌 VARAL DOS SONHOS — Gerenciar Cartinhas (versão FINAL estável)
// ------------------------------------------------------------
// ✅ Status: Gerencia POST/PATCH de cartinhas e carregamento de eventos.
// ------------------------------------------------------------

(() => {
  const API_URL = "../api/cartinha";
  const API_EVENTOS = "../api/eventos";
  const CLOUD_NAME = "drnn5zmxi"; // Seu Cloud Name
  const UPLOAD_PRESET = "unsigned_uploads"; // Seu Upload Preset

  const listaCartinhasBody = document.querySelector("#lista-cartinhas-body");
  const totalCartinhasSpan = document.querySelector("#total-cartinhas");
  const form = document.querySelector("#form-cartinha");
  const previewImagem = document.querySelector("#preview-imagem");
  const selectEvento = document.querySelector("#evento");
  const inputDataEvento = document.querySelector("#data_evento");
  const inputDataLimite = document.querySelector("#data_limite_recebimento");
  const btnLimpar = document.querySelector("#btn-limpar"); 

  let editandoId = null;
  let uploadedUrl = "";
  let eventoAtual = ""; // Armazena o ID do evento (recXXXX)

  // ============================================================
  // 🔹 Carregar eventos "em andamento"
  // ============================================================
  async function carregarEventos() {
    try {
      // 🛑 CHAMADA CRÍTICA: Se esta API estiver com erro, os eventos não aparecem.
      const resp = await fetch(`${API_EVENTOS}?tipo=admin`);
      const data = await resp.json();
      
      // Filtra por status "em andamento"
      const eventos = data.eventos?.filter(e => e.status_evento === "em andamento") || [];

      if (eventos.length === 0) {
        selectEvento.innerHTML = `<option value="">Nenhum evento ativo</option>`;
        return;
      }

      selectEvento.innerHTML = `<option value="">Selecione um evento</option>`;
      eventos.forEach(ev => {
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.textContent = ev.nome_evento;
        opt.dataset.dataEvento = ev.data_evento;
        opt.dataset.dataLimite = ev.data_limite_recebimento;
        selectEvento.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      selectEvento.innerHTML = `<option value="">Erro ao carregar (verifique /api/eventos)</option>`;
    }
  }

  selectEvento.addEventListener("change", (e) => {
    const opt = e.target.selectedOptions[0];
    if (!opt) {
      eventoAtual = "";
      inputDataEvento.value = "";
      inputDataLimite.value = "";
      carregarCartinhas(); // Limpa a lista
      return;
    }
    inputDataEvento.value = opt.dataset.dataEvento || "";
    inputDataLimite.value = opt.dataset.dataLimite || "";
    eventoAtual = opt.value;
    carregarCartinhas(); // Filtra cartinhas do evento selecionado
  });

  // ============================================================
  // 🔹 Upload Cloudinary 
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
        previewImagem.innerHTML = `<img src="${uploadedUrl}" alt="Prévia" class="mt-2 rounded-lg border border-blue-200 shadow-md mx-auto" style="max-width:150px;">`;
      } else previewImagem.innerHTML = `<p class="text-red-500">❌ Falha no upload.</p>`;
    } catch (err) {
      previewImagem.innerHTML = `<p class="text-red-500">Erro ao enviar imagem.</p>`;
    }
  });

  // ============================================================
  // 🔹 Enviar formulário
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!eventoAtual) return alert("Selecione um evento antes de cadastrar!");

    const formData = new FormData(form);
    
    // Prepara a imagem para o formato Airtable Attachment (JSON string)
    formData.append("imagem_cartinha", uploadedUrl ? JSON.stringify([{ url: uploadedUrl }]) : JSON.stringify([]));
    
    // ✅ Envia o ID do evento (recXXXX) para vincular ao campo data_evento no backend
    formData.append("data_evento", eventoAtual); 
    formData.append("evento_id", eventoAtual); // Redundante, mas mantém a compatibilidade
    
    // Remove campos Lookups para evitar erro no POST/PATCH
    formData.delete("nome_evento"); 
    formData.delete("data_limite_recebimento"); 
    
    try {
      const metodo = editandoId ? "PATCH" : "POST";
      const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;
      
      const resp = await fetch(url, { method: metodo, body: formData });
      const resultado = await resp.json();

      if (resultado.sucesso) {
        alert(editandoId ? "Cartinha atualizada!" : "Cartinha cadastrada!");
        form.reset();
        previewImagem.innerHTML = "";
        uploadedUrl = "";
        editandoId = null;
        carregarCartinhas();
      } else alert("Erro: " + (resultado.mensagem || JSON.stringify(resultado)));
    } catch (err) {
      alert("Erro ao salvar cartinha.");
    }
  });
  
  // ... Funções de edição, inativar e carregar cartinhas (Mantidas)
  
  // Função para limpar o formulário
  btnLimpar?.addEventListener("click", () => {
    form.reset();
    editandoId = null;
    uploadedUrl = "";
    previewImagem.innerHTML = "";
    // Não limpa o eventoAtual, para manter o filtro ativo.
    alert("Formulário pronto para novo cadastro.");
  });

  // Inicialização
  carregarEventos();
})();