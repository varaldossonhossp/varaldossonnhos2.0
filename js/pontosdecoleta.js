// ============================================================
// 💙 VARAL DOS SONHOS — js/pontosdecoleta.js
// Mostra pontos de coleta vindos do Airtable via API
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById("lista-pontos");
  lista.innerHTML = "<p>Carregando pontos de coleta...</p>";

  try {
    const resp = await fetch("/api/pontosdecoleta");
    const dados = await resp.json();

    if (!dados.sucesso) throw new Error("Erro ao buscar dados.");

    lista.innerHTML = dados.pontos.map(p => `
      <div class="card-ponto">
        <h3>${p.nome_ponto}</h3>
        <p><strong>Endereço:</strong> ${p.endereco}</p>
        <p><strong>Responsável:</strong> ${p.responsavel}</p>
        <p><strong>Telefone:</strong> ${p.telefone}</p>
        <p><strong>Email:</strong> ${p.email_ponto}</p>
        <p><strong>Horário:</strong> ${p.horario_funcionamento || p.horario}</p>
      </div>
    `).join("");
  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `<p style="color:red;">${erro.message}</p>`;
  }
});
