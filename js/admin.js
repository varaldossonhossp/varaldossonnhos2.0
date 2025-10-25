// ============================================================
// 💼 VARAL DOS SONHOS — js/admin.js
// ------------------------------------------------------------
// Controla o painel administrativo (admin.html):
//   • Autenticação com ADMIN_SECRET
//   • Criação de eventos
//   • Listagem, exclusão e atualização
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const btnLogin = document.getElementById("btnLogin");
  const authMsg = document.getElementById("authMsg");
  const formEvento = document.getElementById("formEvento");
  const msg = document.getElementById("msg");
  const listaEventos = document.getElementById("listaEventos");
  const divEventos = document.getElementById("eventos");

  let tokenAdmin = "";

  // ============================================================
  // 🔑 LOGIN DO ADMINISTRADOR
  // ============================================================
  btnLogin.addEventListener("click", async () => {
    tokenAdmin = tokenInput.value.trim();

    if (!tokenAdmin) {
      authMsg.textContent = "⚠️ Informe o token administrativo.";
      authMsg.style.color = "red";
      return;
    }

    // testa o token chamando /api/admin?tipo=eventos
    try {
      const resp = await fetch("/api/admin?tipo=eventos");
      if (resp.ok) {
        authMsg.textContent = "✅ Acesso liberado.";
        authMsg.style.color = "green";
        tokenInput.disabled = true;
        btnLogin.disabled = true;
        formEvento.style.display = "block";
        listaEventos.style.display = "block";
        carregarEventos();
      } else {
        throw new Error("Falha no acesso");
      }
    } catch {
      authMsg.textContent = "❌ Erro ao verificar token.";
      authMsg.style.color = "red";
    }
  });

  // ============================================================
  // 📅 CRIAR NOVO EVENTO
  // ============================================================
  formEvento.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const data_evento = document.getElementById("data_evento").value;
    const imagensRaw = document.getElementById("imagens").value.trim();

    if (!titulo || !descricao) {
      msg.textContent = "⚠️ Preencha título e descrição.";
      msg.style.color = "red";
      return;
    }

    // transforma URLs em formato aceito pelo Airtable
    const imagens = imagensRaw
      ? imagensRaw.split(",").map((url) => ({ url: url.trim() }))
      : [];

    msg.textContent = "⏳ Enviando...";
    msg.style.color = "black";

    try {
      const resp = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "eventos",
          acao: "criar",
          token_admin: tokenAdmin,
          titulo,
          descricao,
          data_evento,
          imagens,
        }),
      });

      const json = await resp.json();
      if (json.sucesso) {
        msg.textContent = "✅ Evento criado com sucesso!";
        msg.style.color = "green";
        formEvento.reset();
        carregarEventos();
      } else {
        msg.textContent = "❌ Erro: " + json.mensagem;
        msg.style.color = "red";
      }
    } catch (erro) {
      msg.textContent = "❌ Falha ao criar evento.";
      msg.style.color = "red";
      console.error(erro);
    }
  });

  // ============================================================
  // 🗂️ LISTAR EVENTOS EXISTENTES
  // ============================================================
  async function carregarEventos() {
    divEventos.innerHTML = "<p>⏳ Carregando eventos...</p>";
    try {
      const resp = await fetch("/api/admin?tipo=eventos");
      const json = await resp.json();

      if (!json.sucesso) {
        divEventos.innerHTML = "<p>❌ Erro ao carregar eventos.</p>";
        return;
      }

      if (json.eventos.length === 0) {
        divEventos.innerHTML = "<p>Nenhum evento cadastrado ainda 💙</p>";
        return;
      }

      divEventos.innerHTML = "";
      json.eventos.forEach((ev) => {
        const f = ev.fields;
        const imagens = f.imagem || [];

        const bloco = document.createElement("div");
        bloco.className = "evento";

        bloco.innerHTML = `
          <h3>${f.titulo || "Sem título"}</h3>
          <p>${f.descricao || ""}</p>
          <p>📅 ${f.data_evento ? new Date(f.data_evento).toLocaleDateString("pt-BR") : "Sem data"}</p>
          <div class="fotos">
            ${imagens
              .map(
                (img) => `<img src="${img.url}" alt="${f.titulo}" title="${f.titulo}">`
              )
              .join("")}
          </div>
          <div class="acoes">
            <button class="ativar">${f.ativo ? "Desativar" : "Ativar"}</button>
            <button class="excluir">Excluir</button>
          </div>
        `;

        // botão ativar/desativar
        bloco.querySelector(".ativar").addEventListener("click", async () => {
          await atualizarStatus(ev.id, !f.ativo);
        });

        // botão excluir
        bloco.querySelector(".excluir").addEventListener("click", async () => {
          if (confirm(`Excluir o evento "${f.titulo}"?`)) {
            await excluirEvento(ev.id);
          }
        });

        divEventos.appendChild(bloco);
      });
    } catch (erro) {
      console.error("Erro ao listar eventos:", erro);
      divEventos.innerHTML = "<p>❌ Erro ao carregar eventos.</p>";
    }
  }

  // ============================================================
  // 🔄 ATUALIZAR STATUS (ativo/inativo)
  // ============================================================
  async function atualizarStatus(id_evento, ativo) {
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "eventos",
          acao: "atualizar",
          token_admin: tokenAdmin,
          id_evento,
          ativo,
        }),
      });
      carregarEventos();
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  }

  // ============================================================
  // ❌ EXCLUIR EVENTO
  // ============================================================
  async function excluirEvento(id_evento) {
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "eventos",
          acao: "excluir",
          token_admin: tokenAdmin,
          id_evento,
        }),
      });
      carregarEventos();
    } catch (erro) {
      console.error("Erro ao excluir evento:", erro);
    }
  }
});
