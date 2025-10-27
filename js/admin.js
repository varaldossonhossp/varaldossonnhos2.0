// ============================================================
// 💼 VARAL DOS SONHOS — js/admin.js (compatível com tabela "eventos")
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
      const url = `/api/admin?tipo=eventos&token_admin=${encodeURIComponent(tokenAdmin)}`;
      const resp = await fetch(url, { headers: H() });
      if (resp.ok) {
        authMsg.textContent = "✅ Acesso liberado.";
        authMsg.style.color = "green";
        tokenInput.disabled = true;
        btnLogin.disabled = true;
        formEvento.style.display = "block";
        listaEventos.style.display = "block";
        carregarEventos();
      } else {
        authMsg.textContent = "❌ Token inválido.";
        authMsg.style.color = "red";
      }
    } catch {
      authMsg.textContent = "❌ Erro ao verificar token.";
      authMsg.style.color = "red";
    }
  });

  // 📅 CRIAR NOVO EVENTO
  formEvento.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const local = document.getElementById("local").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const data_evento = document.getElementById("data_evento").value || null;
    const data_limite_recebimento = document.getElementById("data_limite_recebimento").value || null;
    const destacar = document.getElementById("destacar")?.checked ?? false;

    const imagensRaw = document.getElementById("imagens").value.trim();
    const imagens = imagensRaw ? imagensRaw.split(",").map(u => ({ url: u.trim() })) : [];

    if (!titulo || !descricao) {
      msg.textContent = "⚠️ Preencha título e descrição.";
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
          modo: "eventos",
          acao: "criar",
          token_admin: tokenAdmin,
          // mapeamento para os campos da tabela
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
        msg.textContent = "✅ Evento criado!";
        msg.style.color = "green";
        formEvento.reset();
        carregarEventos();
      } else {
        msg.textContent = "❌ Erro: " + (json.mensagem || "Falha ao criar.");
        msg.style.color = "red";
      }
    } catch (erro) {
      console.error(erro);
      msg.textContent = "❌ Falha ao criar evento.";
      msg.style.color = "red";
    }
  });

  // 🗂️ LISTAR
  async function carregarEventos() {
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
          <h3>${f.nome_evento || "Sem título"}</h3>
          <p>${f.descricao || ""}</p>
          <p>📍 ${f.local_evento || "—"}</p>
          <p>📅 ${f.data_evento ? new Date(f.data_evento).toLocaleDateString("pt-BR") : "Sem data"}</p>
          <p>⏳ Limite: ${f.data_limite_recebimento ? new Date(f.data_limite_recebimento).toLocaleDateString("pt-BR") : "—"}</p>
          <p>Status: ${f.status_evento || "—"} ${f.destacar_na_homepage ? "⭐" : ""}</p>
          <div class="fotos">
            ${imgs.map(img => `<img src="${img.url}" alt="${f.nome_evento || ""}" />`).join("")}
          </div>
          <div class="acoes">
            <button class="ativar">${f.ativo ? "Desativar" : "Ativar"}</button>
            <button class="encerrar">Encerrar</button>
            <button class="destacar">${f.destacar_na_homepage ? "Remover destaque" : "Destacar"}</button>
            <button class="excluir">Excluir</button>
          </div>
        `;

        bloco.querySelector(".ativar").addEventListener("click", async () => {
          await atualizaCampo(ev.id, { ativo: !f.ativo });
          carregarEventos();
        });

        bloco.querySelector(".encerrar").addEventListener("click", async () => {
          await atualizaCampo(ev.id, { status_evento: "encerrado" });
          carregarEventos();
        });

        bloco.querySelector(".destacar").addEventListener("click", async () => {
          await atualizaCampo(ev.id, { destacar_na_homepage: !f.destacar_na_homepage });
          carregarEventos();
        });

        bloco.querySelector(".excluir").addEventListener("click", async () => {
          if (confirm(`Excluir "${f.nome_evento || "o evento"}"?`)) {
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

  async function atualizaCampo(id_evento, fields) {
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: H(),
        body: JSON.stringify({
          modo: "eventos",
          acao: "atualizar",
          token_admin: tokenAdmin,
          id_evento,
          fields, // campos arbitrários
        }),
      });
    } catch (e) {
      console.error("Erro ao atualizar:", e);
    }
  }

  async function excluirEvento(id_evento) {
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: H(),
        body: JSON.stringify({
          modo: "eventos",
          acao: "excluir",
          token_admin: tokenAdmin,
          id_evento,
        }),
      });
    } catch (e) {
      console.error("Erro ao excluir:", e);
    }
  }
});
