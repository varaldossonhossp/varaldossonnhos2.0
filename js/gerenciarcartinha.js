// ============================================================
// 💙 VARAL DOS SONHOS — gerenciarcartinha.js (VERSÃO FINAL E ROBUSTA)
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
  let isEditing = false; // Indica se estamos em modo de edição (PATCH)

  // Assume que esta função é definida globalmente ou em outro JS e lida com o Imgur/Cloudinary
  // Exemplo: const uploadedData = await uploadImage(file);
  // O resultado deve ser a URL da imagem.
  const uploadImage = (file) => {
    return new Promise((resolve) => {
      // Lógica de upload de imagem aqui (Mock para demonstração)
      console.log("Iniciando upload para Imgur/Cloudinary...");
      // Substituir por sua lógica real de upload
      setTimeout(() => {
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
      const response = await fetch("/api/eventos");
      if (!response.ok) throw new Error("Falha ao carregar eventos.");
      const data = await response.json();

      // Opção default: Nenhuma seleção (necessária para cadastrar sem vincular)
      selectEvento.innerHTML = '<option value="">(Nenhum Evento Vinculado)</option>'; 

      data.eventos.forEach(evento => {
        const option = document.createElement("option");
        option.value = evento.id;
        option.textContent = evento.nome_evento;
        selectEvento.appendChild(option);
      });

      // Define o evento inicial como vazio
      eventoAtual = ""; 

    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      alert("Erro ao carregar a lista de eventos.");
    }
  }

  // ============================================================
  // 🔹 Event Listeners
  // ============================================================

  selectEvento.addEventListener("change", (e) => {
    eventoAtual = e.target.value;
    console.log("Evento Atual:", eventoAtual);
    // Implemente aqui a lógica para carregar cartinhas do evento, se necessário
  });

  document.getElementById("imagem_cartinha").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      uploadedUrl = await uploadImage(file);
      
      // Atualiza a visualização no HTML (ex: uma tag <img>)
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
    
    // 💡 Adiciona a URL da imagem. O Backend espera uma string JSON de array de objetos.
    if (uploadedUrl) {
      formData.append("imagem_cartinha", JSON.stringify([{ url: uploadedUrl }]));
    } else {
      // Se não houver upload, envia um array vazio para limpar ou mantém o valor existente no PATCH
      formData.append("imagem_cartinha", JSON.stringify([]));
    }
    
    // 💡 Adiciona o ID do evento selecionado. O backend lê este campo como 'data_evento'.
    formData.append("data_evento", eventoAtual || ""); 

    
    // 🛑 LIMPEZA CRÍTICA NO FRONTEND: 
    // Remove campos de LOOKUP ou internos que NÃO SÃO para escrita no Airtable, 
    // evitando o erro 'UNKNOWN_FIELD_NAME'.
    formData.delete("evento_id"); 
    formData.delete("data_limite_recebimento"); 
    
    try {
      const response = await fetch(url, {
        method: method,
        body: formData, // O Form Data será lido pelo 'formidable' no backend
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Cartinha ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!`);
        form.reset();
        // Atualizar a lista de cartinhas na tela se houver
        // loadCartinhas();
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
  // Se você tiver uma função para carregar cartinhas iniciais, chame-a aqui:
  // loadCartinhas(); 
});