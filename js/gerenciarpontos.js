/* ============================================================
   💙 VARAL DOS SONHOS — Gerenciar Pontos de Coleta (JS)
   ------------------------------------------------------------
   - Máscara de telefone
   - Busca CEP (ViaCEP) -> preenche logradouro/bairro/cidade/UF
   - Campo "Número" separado, anexado ao endereço no envio
   - CRUD via /api/pontosdecoleta (Airtable)
   ============================================================ */

const tabelaBody = document.getElementById("pontos-list-body");
const totalPontos = document.getElementById("total-pontos");
const formPonto = document.getElementById("form-ponto");
const btnLimpar = document.getElementById("btn-limpar");

let pontos = [];
let editandoId = "";

/* ---------- máscara telefone ---------- */
document.getElementById("telefone").addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  else v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  e.target.value = v;
});

/* ---------- capitalização ---------- */
["nome_ponto", "responsavel"].forEach(id =>
  document.getElementById(id).addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
  })
);

/* ---------- CEP -> endereço ---------- */
document.getElementById("cep").addEventListener("blur", async (e) => {
  const cep = e.target.value.replace(/\D/g, "");
  if (cep.length !== 8) return;
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resp.json();
    if (!dados.erro) {
      // Endereço base sem número (número fica em campo separado)
      document.getElementById("endereco").value =
        `${dados.logradouro}, ${dados.bairro}, ${dados.localidade} - ${dados.uf}`;
    }
  } catch (err) {
    console.error("Erro ao buscar CEP:", err);
  }
});

/* ---------- card visual ---------- */
function criarCardPonto(ponto) {
  return `
    <div class="ponto-coleta-card border-b border-gray-200 pb-4">
      <p><strong>🏠 Nome:</strong> ${ponto.nome_ponto || "—"}</p>
      <p><strong>📍 Endereço:</strong> ${ponto.endereco || "—"}</p>
      <p><strong>👩‍💼 Responsável:</strong> ${ponto.responsavel || "—"}</p>
      <p><strong>📞 Telefone:</strong> ${ponto.telefone || "—"}</p>
      <p><strong>📧 E-mail:</strong> ${ponto.email_ponto || "—"}</p>
      <p><strong>🕒 Horário:</strong> ${ponto.horario || "—"}</p>
      <p><strong>📊 Status:</strong> ${ponto.status || "—"}</p>
      <div class="mt-2 flex gap-2">
        <button onclick="editarPonto('${ponto.id_ponto}')" class="bg-yellow-400 px-3 py-1 rounded">Editar</button>
        <button onclick="excluirPonto('${ponto.id_ponto}')" class="bg-red-600 text-white px-3 py-1 rounded">Excluir</button>
      </div>
    </div>`;
}

/* ---------- carregar pontos ---------- */
async function carregarPontos() {
  try {
    const resp = await fetch("../api/pontosdecoleta");
    const data = await resp.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    pontos = data.pontos;
    totalPontos.textContent = pontos.length;
    tabelaBody.innerHTML = pontos.map(p => criarCardPonto(p)).join("");
  } catch (err) {
    console.error(err);
    tabelaBody.innerHTML = `<p class='text-red-500 text-center'>Erro ao carregar pontos.</p>`;
  }
}

/* ---------- salvar/atualizar ---------- */
formPonto.addEventListener("submit", async e => {
  e.preventDefault();

  const enderecoBase = formPonto.endereco.value.trim();
  const numero = (document.getElementById("numero").value || "").trim();

  // Se não houver número no texto, anexa ", <numero>"
  let enderecoFinal = enderecoBase;
  if (numero && !/,\s*\d{1,6}\b/.test(enderecoBase)) {
    enderecoFinal = `${enderecoBase}, ${numero}`;
  }

  const payload = {
    nome_ponto: formPonto.nome_ponto.value.trim(),
    endereco: enderecoFinal,              // << envia endereço já com número
    responsavel: formPonto.responsavel.value.trim(),
    telefone: formPonto.telefone.value.trim(),
    email_ponto: formPonto.email_ponto.value.trim(),
    horario: formPonto.horario.value.trim(),
    status: formPonto.status.value,
  };

  try {
    const metodo = editandoId ? "PATCH" : "POST";
    if (editandoId) payload.id_ponto = editandoId;

    const resp = await fetch("../api/pontosdecoleta", {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!data.sucesso) throw new Error(data.mensagem);

    formPonto.reset();
    editandoId = "";
    carregarPontos();
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar ponto de coleta.");
  }
});

/* ---------- limpar ---------- */
btnLimpar.addEventListener("click", () => {
  editandoId = "";
  formPonto.reset();
});

/* ---------- editar ---------- */
window.editarPonto = function (id) {
  const ponto = pontos.find(p => p.id_ponto === id);
  if (!ponto) return;
  editandoId = id;

  // Preenche campos existentes
  ["nome_ponto","endereco","responsavel","telefone","email_ponto","horario","status"]
    .forEach(c => { if (formPonto[c]) formPonto[c].value = ponto[c] || ""; });

  // Tenta extrair número do endereço para o campo próprio (ex.: "Rua X, 123, Bairro...")
  const matchNum = (ponto.endereco || "").match(/,\s*(\d{1,6})\b/);
  document.getElementById("numero").value = matchNum ? matchNum[1] : "";

  window.scrollTo({ top: 0, behavior: "smooth" });
};

/* ---------- excluir ---------- */
window.excluirPonto = async function (id) {
  if (!confirm("Deseja excluir este ponto?")) return;
  try {
    const resp = await fetch("../api/pontosdecoleta", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_ponto: id }),
    });
    const data = await resp.json();
    if (!data.sucesso) throw new Error(data.mensagem);
    carregarPontos();
  } catch (err) {
    console.error(err);
    alert("Erro ao excluir ponto.");
  }
};

/* ---------- init ---------- */
window.addEventListener("DOMContentLoaded", carregarPontos);
