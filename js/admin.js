// ============================================================
// 💼 VARAL DOS SONHOS — /js/admin.js (compatível com tabela "eventos")
// ------------------------------------------------------------
// Lógica para criar, listar e gerenciar Eventos via /api/admin.js.
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // Referências aos elementos de autenticação
    const tokenInput = document.getElementById("token");
    const btnLogin = document.getElementById("btnLogin");
    const authMsg = document.getElementById("authMsg");

    // Referências aos elementos de gestão de eventos
    const formEvento = document.getElementById("formEvento");
    const msg = document.getElementById("msg");
    const listaEventos = document.getElementById("listaEventos");
    const divEventos = document.getElementById("eventos");

    let tokenAdmin = ""; // Armazena o token após o login

    // Função auxiliar para montar os cabeçalhos de requisição
    const H = () => ({
        "Content-Type": "application/json",
        "x-admin-token": tokenAdmin || "",
        "Cache-Control": "no-store",
    });

    // 🔑 LOGIN (apenas valida o token consultando a listagem)
    btnLogin.addEventListener("click", async () => {
        tokenAdmin = tokenInput.value.trim();
        if (!tokenAdmin) {
            authMsg.textContent = "⚠️ Informe o token administrativo.";
            authMsg.style.color = "red";
            return;
        }

        try {
            // Usa o token no GET para validação
            const url = `/api/admin?tipo=eventos&token_admin=${encodeURIComponent(tokenAdmin)}`;
            const resp = await fetch(url, { headers: H() });

            if (resp.ok) {
                authMsg.textContent = "✅ Acesso liberado. Carregando dados...";
                authMsg.style.color = "green";
                tokenInput.disabled = true;
                btnLogin.disabled = true;
                // Exibe as áreas de administração
                formEvento.style.display = "grid"; // Usa 'grid' ou 'block'
                listaEventos.style.display = "block";
                carregarEventos();
            } else {
                authMsg.textContent = "❌ Token inválido. Tente novamente.";
                authMsg.style.color = "red";
            }
        } catch {
            authMsg.textContent = "❌ Erro ao verificar token. Verifique o servidor.";
            authMsg.style.color = "red";
        }
    });

    // 📅 CRIAR NOVO EVENTO
    formEvento.addEventListener("submit", async (e) => {
        e.preventDefault();

        const titulo = document.getElementById("titulo").value.trim();
        const local = document.getElementById("local").value.trim(); // ⚠️ Adicionado
        const descricao = document.getElementById("descricao").value.trim();
        const data_evento = document.getElementById("data_evento").value || null;
        const data_limite_recebimento = document.getElementById("data_limite_recebimento").value || null; // ⚠️ Adicionado
        const destacar = document.getElementById("destacar")?.checked ?? false;

        const imagensRaw = document.getElementById("imagens").value.trim();
        // Mapeia URLs para o formato de anexo do Airtable: [{ url: "..." }]
        const imagens = imagensRaw ? imagensRaw.split(",").map(u => ({ url: u.trim() })) : []; 

        if (!titulo || !descricao || !local || !data_evento) {
            msg.textContent = "⚠️ Preencha Título, Local, Data e Descrição.";
            msg.style.color = "red";
            return;
        }

        msg.textContent = "⏳ Enviando...";
        msg.style.color = "black";

        try {
            const resp = await fetch("/api/admin", {
                method: "POST",
                headers: H(),
                body: JSON.stringify({
                    // O modo não é usado pela API, mas mantido por clareza
                    // modo: "eventos", 
                    acao: "criar",
                    token_admin: tokenAdmin,
                    // Mapeamento EXATO para os campos da tabela "eventos"
                    nome_evento: titulo,
                    local_evento: local,
                    descricao,
                    data_evento,
                    data_limite_recebimento,
                    destacar_na_homepage: destacar,
                    imagem: imagens, 
                }),
            });
            const json = await resp.json();

            if (json.sucesso) {
                msg.textContent = "✅ Evento criado com ID: " + json.id;
                msg.style.color = "green";
                formEvento.reset();
                carregarEventos();
            } else {
                msg.textContent = "❌ Erro: " + (json.mensagem || "Falha ao criar evento.");
                msg.style.color = "red";
            }
        } catch (erro) {
            console.error(erro);
            msg.textContent = "❌ Falha ao criar evento (Erro de rede/servidor).";
            msg.style.color = "red";
        }
    });

    // 🗂️ LISTAR TODOS OS EVENTOS
    window.carregarEventos = async function carregarEventos() {
        divEventos.innerHTML = "<p>⏳ Carregando eventos...</p>";
        try {
            const url = `/api/admin?tipo=eventos&token_admin=${encodeURIComponent(tokenAdmin)}`;
            const resp = await fetch(url, { headers: H() });
            const json = await resp.json();

            if (!json.sucesso) {
                divEventos.innerHTML = "<p>❌ Erro ao carregar eventos.</p>";
                return;
            }

            if (!json.eventos?.length) {
                divEventos.innerHTML = "<p>Nenhum evento cadastrado 💙</p>";
                return;
            }

            divEventos.innerHTML = "";
            json.eventos.forEach((ev) => {
                const f = ev.fields || {};
                const imgs = f.imagem || [];

                const bloco = document.createElement("div");
                bloco.className = "evento";
                bloco.innerHTML = `
                    <h3>${f.nome_evento || "Sem título"} (ID: ${ev.id})</h3>
                    <p><strong>Status:</strong> ${f.status_evento || "—"} ${f.destacar_na_homepage ? "⭐" : ""}</p>
                    <p>📍 ${f.local_evento || "—"}</p>
                    <p>📅 Evento: ${f.data_evento ? new Date(f.data_evento).toLocaleDateString("pt-BR") : "Sem data"}</p>
                    <p>⏳ Limite Receb.: ${f.data_limite_recebimento ? new Date(f.data_limite_recebimento).toLocaleDateString("pt-BR") : "—"}</p>
                    <p>${f.descricao || ""}</p>
                    <div class="fotos">
                        ${imgs.map(img => `<img src="${img.url}" alt="${f.nome_evento || ""}" />`).join("")}
                    </div>
                    <div class="acoes">
                        <button class="ativar" data-id="${ev.id}" data-ativo="${f.ativo}">${f.ativo ? "Desativar" : "Ativar"}</button>
                        <button class="encerrar" data-id="${ev.id}">Encerrar</button>
                        <button class="destacar" data-id="${ev.id}" data-destacar="${f.destacar_na_homepage}">${f.destacar_na_homepage ? "Remover destaque" : "Destacar"}</button>
                        <button class="excluir" data-id="${ev.id}">Excluir</button>
                    </div>
                `;
                
                // Adiciona listeners aos botões
                bloco.querySelector(".ativar").addEventListener("click", async (e) => {
                    const ativoAtual = e.target.getAttribute('data-ativo') === 'true';
                    await atualizaCampo(ev.id, { ativo: !ativoAtual });
                    carregarEventos();
                });

                bloco.querySelector(".encerrar").addEventListener("click", async () => {
                    await atualizaCampo(ev.id, { status_evento: "encerrado" });
                    carregarEventos();
                });

                bloco.querySelector(".destacar").addEventListener("click", async (e) => {
                    const destacarAtual = e.target.getAttribute('data-destacar') === 'true';
                    await atualizaCampo(ev.id, { destacar_na_homepage: !destacarAtual });
                    carregarEventos();
                });

                bloco.querySelector(".excluir").addEventListener("click", async () => {
                    if (confirm(`Tem certeza que deseja EXCLUIR permanentemente o evento "${f.nome_evento || "o evento"}"?`)) {
                        await excluirEvento(ev.id);
                        carregarEventos();
                    }
                });

                divEventos.appendChild(bloco);
            });
        } catch (e) {
            console.error(e);
            divEventos.innerHTML = "<p>❌ Erro ao carregar eventos.</p>";
        }
    }

    // 🔄 Função de atualização genérica (para Ativar/Encerrar/Destacar)
    async function atualizaCampo(id_evento, fields) {
        msg.textContent = "⏳ Atualizando...";
        msg.style.color = "black";
        try {
            const resp = await fetch("/api/admin", {
                method: "POST",
                headers: H(),
                body: JSON.stringify({
                    acao: "atualizar",
                    token_admin: tokenAdmin,
                    id_evento,
                    fields, // { campo: novo_valor }
                }),
            });
            const json = await resp.json();
            if (json.sucesso) {
                msg.textContent = "✅ Atualizado!";
                msg.style.color = "green";
            } else {
                msg.textContent = "❌ Erro ao atualizar: " + (json.mensagem || "Falha.");
                msg.style.color = "red";
            }
        } catch (e) {
            console.error("Erro ao atualizar:", e);
            msg.textContent = "❌ Erro de rede na atualização.";
            msg.style.color = "red";
        }
    }

    // 🗑️ Função de exclusão
    async function excluirEvento(id_evento) {
        msg.textContent = "⏳ Excluindo...";
        msg.style.color = "black";
        try {
            const resp = await fetch("/api/admin", {
                method: "POST",
                headers: H(),
                body: JSON.stringify({
                    acao: "excluir",
                    token_admin: tokenAdmin,
                    id_evento,
                }),
            });
            const json = await resp.json();
            if (json.sucesso) {
                msg.textContent = "✅ Evento excluído!";
                msg.style.color = "green";
            } else {
                msg.textContent = "❌ Erro ao excluir: " + (json.mensagem || "Falha.");
                msg.style.color = "red";
            }
        } catch (e) {
            console.error("Erro ao excluir:", e);
            msg.textContent = "❌ Erro de rede na exclusão.";
            msg.style.color = "red";
        }
    }
});