// ============================================================
// 💙 VARAL DOS SONHOS — js/pontosdecoleta.js
// Busca pontos ativos do Airtable via /api/pontosdecoleta
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById("lista-pontos");
  lista.innerHTML = "<p>Carregando pontos de coleta...</p>";

  try {
    const resp = await fetch("/api/pontosdecoleta");
    const json = await resp.json();

    if (!json.sucesso) throw new Error("Erro ao buscar pontos.");

    lista.innerHTML = json.pontos.map(p => `
      <div class="card-ponto">
        <h3>${p.nome_ponto}</h3>
        <p><strong>Endereço:</strong> ${p.endereco}</p>
        <p><strong>Responsável:</strong> ${p.responsavel}</p>
        <p><strong>Telefone:</strong> ${p.telefone}</p>
        <p><strong>Email:</strong> ${p.email_ponto}</p>
        <p><strong>Funcionamento:</strong> ${p.horario}</p>
      </div>
    `).join("");
  } catch (e) {
    lista.innerHTML = `<p style="color:red;">${e.message}</p>`;
  }
});
