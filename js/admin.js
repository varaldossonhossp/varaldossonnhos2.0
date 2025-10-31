// ============================================================
// 💼 VARAL DOS SONHOS — /js/admin.js (versão TCC)
// ------------------------------------------------------------
// Este script controla o Painel Administrativo.
// Permite ao administrador:
//   - Validar o token de acesso
//   - Criar, listar, destacar e encerrar eventos
//   - Excluir eventos da base Airtable
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const btnLogin = document.getElementById("btnLogin");
  const authMsg = document.getElementById("authMsg");
  const formEvento = document.getElementById("formEvento");
  const msg = document.getElementById("msg");
  const divEventos = document.getElementById("eventos");
  const listaEventos = document.getElementById("listaEventos");

  let tokenAdmin = "";

  // ============================================================
  // 🔑 LOGIN ADMINISTRATIVO
  // ============================================================
  btnLogin.addEventListener("click", async () => {
    tokenAdmin = tokenInput.value.trim();
    if (!tokenAdmin) {
      authMsg.textContent = "⚠️ Informe o token administrativo.";
      authMsg.style.color = "red";
      return;
    }

    try {
      const url = `/api/admin?tipo=eventos&token_admin=${encodeURIComponent(tokenAdmin)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Token inválido");

      authMsg.textContent = "✅ Acesso liberado!";
      authMsg.style.color = "green";
      tokenInput.disabled = true;
      btnLogin.disabled = true;
      formEvento.style.display = "grid";
      listaEventos.style.display = "block";
      carregarEventos();
    } catch {
      authMsg.textContent = "❌ Token inválido. Tente novamente.";
      authMsg.style.color = "red";
    }
  });

  // ============================================================
  // 📅 CRIAR NOVO EVENTO
  // ============================================================
  formEvento.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "⏳ Enviando...";

    const payload = {
      acao: "criar",
      token_admin: tokenAdmin,
      nome_evento: document.getElementById("titulo").value.trim(),
      local_evento: document.getElementById("local").value.trim(),
      descricao: document.getElementById("descricao").value.trim(),
      data_evento: document.getElementById("data_evento").value,
      data_limite_recebimento: document.getElementById("data_limite_recebimento").value,
      destacar_na_homepage: document.getElementById("destacar").checked,
      imagem: document.getElementById("imagens").value
        .split(",")
        .filter(Boolean)
        .map(u => ({ url: u.trim() })),
    };

    try {
      const resp = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      if (data.sucesso) {
        msg.textContent = "✅ Evento criado com sucesso!";
        msg.style.color = "green";
        formEvento.reset();
        carregarEventos();
      } else throw new Error(data.mensagem);
    } catch (e) {
      msg.textContent = "❌ Erro ao criar evento.";
      msg.style.color = "red";
      console.error(e);
    }
  });

  // ============================================================
  // 📋 LISTAR EVENTOS
  // ============================================================
  window.carregarEventos = async function () {
    divEventos.innerHTML = "<p>⏳ Carregando eventos...</p>";
    try {
      const url = `/api/admin?tipo=eventos&token_admin=${encodeURIComponent(tokenAdmin)}`;
      const resp = await fetch(url);
      const json = await resp.json();

      if (!json.sucesso) throw new Error("Erro ao carregar.");

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
          <h3>${f.nome_evento || "Sem título"} (${ev.id})</h3>
          <p><b>Status:</b> ${f.status_evento || "—"} ${f.destacar_na_homepage ? "⭐" : ""}</p>
          <p>📍 ${f.local_evento || "—"}</p>
          <p>📅 ${f.data_evento ? new Date(f.data_evento).toLocaleDateString("pt-BR") : "—"}</p>
          <p>⏳ Recebimento: ${f.data_limite_recebimento ? new Date(f.data_limite_recebimento).toLocaleDateString("pt-BR") : "—"}</p>
          <p>${f.descricao || ""}</p>
          <div class="fotos">${imgs.map(img => `<img src="${img.url}" />`).join("")}</div>
          <div class="acoes">
            <button class="destacar" data-id="${ev.id}">${f.destacar_na_homepage ? "🔽 Remover destaque" : "⭐ Destacar"}</button>
            <button class="encerrar" data-id="${ev.id}">🚫 Encerrar</button>
            <button class="excluir" data-id="${ev.id}">🗑️ Excluir</button>
          </div>
        `;

        // Botões
        bloco.querySelector(".destacar").addEventListener("click", () => atualizar(ev.id, { destacar_na_homepage: !f.destacar_na_homepage }));
        bloco.querySelector(".encerrar").addEventListener("click", () => atualizar(ev.id, { status_evento: "encerrado" }));
        bloco.querySelector(".excluir").addEventListener("click", () => excluir(ev.id));

        divEventos.appendChild(bloco);
      });
    } catch (e) {
      divEventos.innerHTML = "<p>❌ Falha ao carregar eventos.</p>";
      console.error(e);
    }
  };

  // ============================================================
  // 🔄 ATUALIZAR CAMPOS DO EVENTO
  // ============================================================
  async function atualizar(id_evento, fields) {
    try {
      const resp = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "atualizar", token_admin: tokenAdmin, id_evento, fields }),
      });
      const data = await resp.json();
      if (data.sucesso) carregarEventos();
    } catch (e) {
      console.error("Erro ao atualizar:", e);
    }
  }

  // ============================================================
  // 🗑️ EXCLUIR EVENTO
  // ============================================================
  async function excluir(id_evento) {
    if (!confirm("Excluir este evento?")) return;
    try {
      const resp = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "excluir", token_admin: tokenAdmin, id_evento }),
      });
      const data = await resp.json();
      if (data.sucesso) carregarEventos();
    } catch (e) {
      console.error("Erro ao excluir:", e);
    }
  }
});
