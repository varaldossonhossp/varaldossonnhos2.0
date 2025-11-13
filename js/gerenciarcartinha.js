// ============================================================
// 💙 VARAL DOS SONHOS — gerenciarcartinha.js (VERSÃO FINAL DO FRONTEND)
// ------------------------------------------------------------
// ✅ Status: Gerencia POST/PATCH de cartinhas e carregamento de eventos.
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cartinha");
  const selectEvento = document.getElementById("evento");
  const saveButton = document.getElementById("save-button");
  const cleanButton = document.getElementById("clean-button");
  const cartinhaIdInput = document.getElementById("cartinha-id");

  let eventoAtual = null;
  let uploadedUrl = null;
  let isEditing = false; 

  // 🛑 MOCK DE UPLOAD DE IMAGEM: SUBSTITUA PELA SUA FUNÇÃO REAL
  const uploadImage = (file) => {
    return new Promise((resolve) => {
      console.log("Iniciando MOCK de upload de imagem...");
      setTimeout(() => {
        // URL MOCK: Seu backend espera uma URL válida de Attachment.
        const mockUrl = `https://mock-image-url.com/${file.name}`;
        resolve(mockUrl);
      }, 1000);
    });
  };

  // ============================================================
  // 🔹 Funções de Carregamento
  // ============================================================

  async function loadEventos() {
    try {
      // 🚨 ASSUME QUE EXISTE UMA API /api/eventos QUE RETORNA { eventos: [...] }
      const response = await fetch("/api/eventos");
      if (!response.ok) throw new Error("Falha ao carregar eventos.");
      const data = await response.json();

      selectEvento.innerHTML = '<option value="">(Nenhum Evento Vinculado)</option>'; 

      data.eventos.forEach(evento => {
        const option = document.createElement("option");
        option.value = evento.id;
        option.textContent = evento.nome_evento;
        selectEvento.appendChild(option);
      });

      eventoAtual = ""; 

    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      // Mostra o erro no console e permite o cadastro da cartinha sem evento
      selectEvento.innerHTML = '<option value="">(Erro ao carregar eventos)</option>';
    }
  }

  // ============================================================
  // 🔹 Event Listeners
  // ============================================================

  selectEvento.addEventListener("change", (e) => {
    eventoAtual = e.target.value;
  });

  document.getElementById("imagem_cartinha").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🚨 Lógica de upload deve ser substituída pela sua função real.
    try {
      uploadedUrl = await uploadImage(file);
      const preview = document.getElementById("image-preview");
      preview.innerHTML = `<img src="${uploadedUrl}" alt="Preview" style="max-width: 100%; height: auto;">`;
      alert(`Upload da imagem concluído. URL salva: ${uploadedUrl}`);
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      alert("Falha no upload da imagem.");
      uploadedUrl = null;
    }
  });

  cleanButton.addEventListener("click", () => {
    form.reset();
    cartinhaIdInput.value = "";
    isEditing = false;
    saveButton.textContent = "Salvar";
    uploadedUrl = null;
    document.getElementById("image-preview").innerHTML = "";
    selectEvento.value = "";
    eventoAtual = "";
    alert("Formulário limpo.");
  });


  // ============================================================
  // 🔹 SUBMIT DO FORMULÁRIO (POST/PATCH)
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const method = isEditing ? "PATCH" : "POST";
    const id = cartinhaIdInput.value;
    const url = isEditing ? `/api/cartinha?id=${id}` : "/api/cartinha";

    const formData = new FormData(form);
    
    // Adiciona a URL da imagem.
    if (uploadedUrl) {
      formData.append("imagem_cartinha", JSON.stringify([{ url: uploadedUrl }]));
    } else if (!isEditing) {
      // Apenas no POST, garantimos um array vazio se não houver imagem
      formData.append("imagem_cartinha", JSON.stringify([]));
    }
    
    // Adiciona o ID do evento selecionado.
    formData.append("data_evento", eventoAtual || ""); 
    
    // 🛑 LIMPEZA CRÍTICA NO FRONTEND: 
    // Remove campos de LOOKUP ou internos que NÃO SÃO para escrita no Airtable.
    formData.delete("evento_id"); // Excluído do POST/PATCH
    formData.delete("data_limite_recebimento"); // Excluído do POST/PATCH
    
    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Cartinha ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!`);
        form.reset();
        // Limpa o estado de upload após o sucesso
        uploadedUrl = null; 
        document.getElementById("image-preview").innerHTML = "";
      } else {
        throw new Error(data.mensagem || `Erro do servidor: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  });

  // Inicia o carregamento de dados
  loadEventos(); 
});