// ============================================================
// 💌 VARAL DOS SONHOS — Gerenciar Cartinhas (versão FINAL estável)
// ------------------------------------------------------------
// ✅ Status: Gerencia POST/PATCH de cartinhas e carregamento de eventos.
// ------------------------------------------------------------
// ✅ CORREÇÃO: Nome do arquivo ajustado (sem hífen) e chamadas alert() 
//    substituídas por modal customizado.
// ============================================================

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
    // 🔹 FUNÇÃO DE MENSAGEM CUSTOMIZADA (Substitui alert())
    // ============================================================
    function exibirMensagem(titulo, mensagem, isError = false) {
        console.log(`${isError ? 'ERRO' : 'INFO'}: ${titulo} - ${mensagem}`);
        
        const modalId = 'custom-message-modal';
        let modal = document.getElementById(modalId);
        
        // Remove modal existente se houver
        if (modal) {
            document.body.removeChild(modal);
        }

        // Cria o novo modal
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity';
        
        const cardClass = isError ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600';
        const titleClass = isError ? 'text-red-700' : 'text-blue-700';

        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full transform transition-all">
                <h3 class="text-xl font-bold ${titleClass} mb-4">${titulo}</h3>
                <p class="text-gray-700">${mensagem}</p>
                <button 
                    class="mt-4 text-white px-4 py-2 rounded font-semibold ${cardClass}"
                    onclick="document.body.removeChild(this.closest('#${modalId}'))">
                    Fechar
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
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
            } else exibirMensagem("Upload Falho", "❌ Falha no upload da imagem.", true);
        } catch (err) {
            exibirMensagem("Erro de Conexão", "Erro ao enviar imagem para o Cloudinary.", true);
        }
    });

    // ============================================================
    // 🔹 Enviar formulário
    // ============================================================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!eventoAtual) return exibirMensagem("Atenção", "Selecione um evento antes de cadastrar!", true);

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
            
            // Note: O FormData é enviado diretamente com fetch
            const resp = await fetch(url, { method: metodo, body: formData });
            const resultado = await resp.json();

            if (resultado.sucesso) {
                exibirMensagem("Sucesso", editandoId ? "Cartinha atualizada!" : "Cartinha cadastrada!");
                form.reset();
                previewImagem.innerHTML = "";
                uploadedUrl = "";
                editandoId = null;
                carregarCartinhas();
            } else exibirMensagem("Erro na API", "Erro: " + (resultado.mensagem || JSON.stringify(resultado)), true);
        } catch (err) {
            exibirMensagem("Erro de Conexão", "Erro ao salvar cartinha. Verifique a API.", true);
        }
    });
    
    // ============================================================
    // 🔹 FUNÇÃO PLACEHOLDER (Carregar Cartinhas)
    // ------------------------------------------------------------
    // NOTA: A lógica para buscar e renderizar a lista de cartinhas 
    // está faltando no código fornecido. Esta é uma versão mínima 
    // para evitar erros de referência, mas precisa ser completada.
    // ============================================================
    async function carregarCartinhas() {
        // Exibe o carregamento da lista (seletor #lista-cartinhas-body)
        if (listaCartinhasBody) {
            listaCartinhasBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">
                ${eventoAtual ? 'Carregando cartinhas...' : 'Selecione um evento para carregar as cartinhas.'}
            </td></tr>`;
        }

        if (!eventoAtual) {
            totalCartinhasSpan.textContent = 0;
            return;
        }

        try {
            // Busca as cartinhas para o eventoAtual (recXXXX)
            const resp = await fetch(`${API_URL}?eventoId=${eventoAtual}`);
            const data = await resp.json();

            if (data.sucesso && data.cartinhas) {
                // A lógica completa de renderização de tabela deve vir aqui.
                // Exemplo de atualização de contador:
                totalCartinhasSpan.textContent = data.cartinhas.length;
                
                // Exemplo de placeholder para a tabela:
                // listaCartinhasBody.innerHTML = data.cartinhas.map(c => `<tr>...</tr>`).join('');
            } else {
                listaCartinhasBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">
                    Erro ao carregar lista de cartinhas.
                </td></tr>`;
            }
        } catch (err) {
            console.error("Erro ao carregar cartinhas:", err);
            listaCartinhasBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">
                Falha na comunicação com a API /api/cartinha.
            </td></tr>`;
        }
    }
    
    // ============================================================
    // 🔹 Outros Handlers
    // ============================================================
    
    // Função para limpar o formulário
    btnLimpar?.addEventListener("click", () => {
        form.reset();
        editandoId = null;
        uploadedUrl = "";
        previewImagem.innerHTML = "";
        // Não limpa o eventoAtual, para manter o filtro ativo.
        exibirMensagem("Limpeza", "Formulário pronto para novo cadastro.");
    });

    // Inicialização
    carregarEventos();
})();