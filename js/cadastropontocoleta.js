// ============================================================
// 💙 VARAL DOS SONHOS — js/cadastropontocoleta.js
// ------------------------------------------------------------
// Cadastro + Edição + Exclusão de Pontos de Coleta
// Com: TitleCase, Máscara CEP, ViaCEP, Máscara Telefone
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-ponto");

  const id_ponto = document.getElementById("id_ponto");
  const nome_ponto = document.getElementById("nome_ponto");
  const responsavel = document.getElementById("responsavel");
  const cep = document.getElementById("cep");
  const numero = document.getElementById("numero");
  const endereco = document.getElementById("endereco");
  const telefone = document.getElementById("telefone");
  const email_ponto = document.getElementById("email_ponto");
  const horario = document.getElementById("horario");
  const status = document.getElementById("status");

  const lista = document.getElementById("lista-pontos");
  const total = document.getElementById("total-pontos");
  const btnLimpar = document.getElementById("btn-limpar");

  // -------------------------
  // Função TitleCase
  const titleCase = (str) =>
    str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

  function aplicarTitleCase(campo) {
    campo.addEventListener("blur", () => {
      if (campo.value.trim())
        campo.value = titleCase(campo.value.trim());
    });
  }

  aplicarTitleCase(nome_ponto);
  aplicarTitleCase(responsavel);
  aplicarTitleCase(endereco);
  aplicarTitleCase(horario);

  // -------------------------
  // Máscara telefone
  telefone.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10)
      v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    e.target.value = v;
  });

  // -------------------------
  // Máscara CEP
  cep.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length >= 6) v = v.replace(/^(\d{5})(\d{1,3}).*/, "$1-$2");
    e.target.value = v;
  });

  // -------------------------
  // Buscar endereço pelo CEP
  cep.addEventListener("blur", async () => {
    const limpar = () => endereco.value = "";

    const c = cep.value.replace(/\D/g, "");
    if (c.length !== 8) return limpar();

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const json = await resp.json();
      if (json.erro) return limpar();

      endereco.value =
        `${json.logradouro}, ${json.bairro}, ${json.localidade} - ${json.uf}`;
      endereco.value = titleCase(endereco.value);

    } catch {
      limpar();
    }
  });

  // -------------------------
  // Carregar lista
  async function carregar() {
    try {
      const resp = await fetch("/api/pontosdecoleta");
      const json = await resp.json();

      if (!json.sucesso) return;

      lista.innerHTML = "";
      total.textContent = json.pontos.length;

      json.pontos.forEach((p) => {
        lista.innerHTML += `
          <div class="p-4 border rounded-lg bg-blue-50 shadow-sm">
            <p><strong>Nome:</strong> ${p.nome_ponto}</p>
            <p><strong>Responsável:</strong> ${p.responsavel}</p>
            <p><strong>CEP:</strong> ${p.cep || ""}</p>
            <p><strong>Endereço:</strong> ${p.endereco}</p>
            <p><strong>Número:</strong> ${p.numero || ""}</p>
            <p><strong>Telefone:</strong> ${p.telefone || ""}</p>
            <p><strong>E-mail:</strong> ${p.email_ponto || ""}</p>
            <p><strong>Horário:</strong> ${p.horario}</p>
            <p><strong>Status:</strong> ${p.status}</p>

            <div class="flex gap-3 mt-3">
              <button onclick="editar('${p.id_ponto}')"
                class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
                ✏️ Editar
              </button>

              <button onclick="excluir('${p.id_ponto}')"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                🗑 Excluir
              </button>
            </div>
          </div>
        `;
      });

    } catch (e) {
      console.error("Erro ao carregar pontos:", e);
    }
  }

  // -------------------------
  // Editar
  window.editar = async (id) => {
    try {
      const resp = await fetch("/api/pontosdecoleta");
      const json = await resp.json();

      const p = json.pontos.find((x) => x.id_ponto === id);
      if (!p) return;

      id_ponto.value = p.id_ponto;
      nome_ponto.value = p.nome_ponto;
      responsavel.value = p.responsavel;
      endereco.value = p.endereco;
      numero.value = p.numero || "";
      cep.value = p.cep || "";
      telefone.value = p.telefone || "";
      email_ponto.value = p.email_ponto || "";
      horario.value = p.horario;
      status.value = p.status;

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (e) {
      console.error("Erro ao editar ponto:", e);
    }
  };

  // -------------------------
  // Excluir
  window.excluir = async (id) => {
    if (!confirm("Deseja realmente excluir este ponto?")) return;

    try {
      await fetch("/api/pontosdecoleta", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_ponto: id }),
      });

      carregar();

    } catch (e) {
      console.error("Erro ao excluir:", e);
    }
  };

  // -------------------------
  // Salvar
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      id_ponto: id_ponto.value || undefined,
      nome_ponto: nome_ponto.value,
      responsavel: responsavel.value,
      cep: cep.value,
      endereco: endereco.value,
      numero: numero.value,
      telefone: telefone.value,
      email_ponto: email_ponto.value,
      horario: horario.value,
      status: status.value,
    };

    const metodo = id_ponto.value ? "PATCH" : "POST";

    try {
      await fetch("/api/pontosdecoleta", {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      alert("Ponto salvo com sucesso!");

      form.reset();
      id_ponto.value = "";

      carregar();

    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar.");
    }
  });

  // -------------------------
  // Botão limpar
  btnLimpar.addEventListener("click", () => {
    form.reset();
    id_ponto.value = "";
  });

  carregar();
});
