// ============================================================
// 💌 Gerenciar Cartinhas - JS (versão moderna)
// ------------------------------------------------------------
// Conecta com /api/cartinha (CRUD completo no Airtable)
// ============================================================

(() => {
  const API_URL = "../api/cartinha";
  const tabela = document.querySelector("#tabela-cartinhas tbody");
  const form = document.querySelector("#form-cartinha");
  const SELECT_PONTOS = document.getElementById("ponto_coleta");
  let editandoId = null;

  // ============================================================
  // 🔹 Carregar lista de cartinhas
  // ============================================================
  
  async function carregarCartinhas() {
    tabela.innerHTML = `<tr><td colspan="16" style="text-align:center;">Carregando...</td></tr>`;
    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();

      if (!dados.sucesso || !dados.cartinha?.length) {
        tabela.innerHTML = `<tr><td colspan="16" style="text-align:center;">Nenhuma cartinha cadastrada.</td></tr>`;
        return;
      }

      tabela.innerHTML = "";
      dados.cartinha.forEach((c) => {
        const imgUrl = Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
          ? c.imagem_cartinha[0].url
          : "../imagens/cartinha-padrao.png";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.nome_crianca || ""}</td>
          <td>${c.idade || ""}</td>
          <td>${c.sexo || ""}</td>
          <td>${c.sonho || ""}</td>
          <td><img src="${imgUrl}" width="60" alt="Cartinha"></td>
          <td>${c.escola || ""}</td>
          <td>${c.cidade || ""}</td>
          <td>${c.psicologa_responsavel || ""}</td>
          <td>${c.telefone_contato || ""}</td>
          <td>${c.status || ""}</td>
          <td>${c.ponto_coleta || ""}</td>
          <td class="acoes">
            <button class="btn-editar">Editar</button>
            <button class="btn-excluir">Excluir</button>
          </td>
        `;
        tabela.appendChild(tr);

        tr.querySelector(".btn-editar").addEventListener("click", () => editarCartinha(c.id));
        tr.querySelector(".btn-excluir").addEventListener("click", () => excluirCartinha(c.id));
      });
    } catch (err) {
      console.error("Erro ao carregar cartinhas:", err);
      tabela.innerHTML = `<tr><td colspan="16" style="color:red;text-align:center;">Erro ao carregar cartinhas</td></tr>`;
    }
  }

  // ============================================================
  // 🔹 Salvar (criar ou atualizar)
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      nome_crianca: form.nome_crianca.value,
      idade: parseInt(form.idade.value) || null,
      sexo: form.sexo.value,
      sonho: form.sonho.value,
      imagem_cartinha: form.imagem_cartinha.value,
      escola: form.escola.value,
      cidade: form.cidade.value,
      psicologa_responsavel: form.psicologa_responsavel.value,
      telefone_contato: form.telefone_contato.value,
      status: form.status.value,
    };

    try {
      const metodo = editandoId ? "PATCH" : "POST";
      const url = editandoId ? `${API_URL}?id=${editandoId}` : API_URL;
      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert(editandoId ? "Cartinha atualizada com sucesso!" : "Cartinha criada com sucesso!");
        form.reset();
        editandoId = null;
        carregarCartinhas();
      } else {
        alert("Erro ao salvar: " + resultado.mensagem);
      }
    } catch (err) {
      console.error("Erro ao salvar cartinha:", err);
      alert("Erro ao salvar cartinha.");
    }
  });

  // ============================================================
  // 🔹 Editar
  // ============================================================
  async function editarCartinha(id) {
    try {
      const resp = await fetch(API_URL);
      const dados = await resp.json();
      const c = dados.cartinha.find((x) => x.id === id);
      if (!c) return alert("Cartinha não encontrada.");

      editandoId = id;
      form.nome_crianca.value = c.nome_crianca;
      form.idade.value = c.idade;
      form.sexo.value = c.sexo;
      form.sonho.value = c.sonho;
      form.imagem_cartinha.value = Array.isArray(c.imagem_cartinha) && c.imagem_cartinha[0]
        ? c.imagem_cartinha[0].url
        : c.imagem_cartinha;
      form.escola.value = c.escola;
      form.cidade.value = c.cidade;
      form.psicologa_responsavel.value = c.psicologa_responsavel;
      form.telefone_contato.value = c.telefone_contato;
      form.status.value = c.status;
    } catch (err) {
      console.error("Erro ao editar cartinha:", err);
    }
  }

  // ============================================================
  // 🔹 Excluir
  // ============================================================
  async function excluirCartinha(id) {
    if (!confirm("Deseja realmente excluir esta cartinha?")) return;

    try {
      const resp = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
      const resultado = await resp.json();
      if (resultado.sucesso) {
        alert("Cartinha excluída!");
        carregarCartinhas();
      } else {
        alert("Erro ao excluir: " + resultado.mensagem);
      }
    } catch (err) {
      console.error("Erro ao excluir cartinha:", err);
      alert("Erro ao excluir cartinha.");
    }
  }

  // ============================================================
  // 🚀 Inicializa
  // ============================================================
  carregarCartinhas();
})();




