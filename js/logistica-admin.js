async function carregarAdocoes() {
  try {
    const r = await fetch("/api/adocoes");
    const json = await r.json();

    if (!json.sucesso) throw new Error("Erro ao carregar adoções");

    const lista = json.adocoes.filter(a => a.status_adocao === "aguardando confirmacao");

    const tabela = document.getElementById("tabela-adm");
    tabela.innerHTML = "";

    if (lista.length === 0) {
      tabela.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-500">Nenhuma adoção pendente.</td></tr>`;
      return;
    }

    lista.forEach(a => {
      tabela.innerHTML += `
        <tr>
          <td class="p-2">${a.nome_crianca}</td>
          <td class="p-2">${a.sonho}</td>
          <td class="p-2">${a.nome_doador}</td>
          <td class="p-2">
            <button onclick="confirmar('${a.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg">
              Confirmar
            </button>
          </td>
        </tr>`;
    });

  } catch (err) {
    alert("Erro ao carregar adoções");
    console.error(err);
  }
}

async function confirmar(id) {
  const r = await fetch("/api/adocoes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status_adocao: "confirmada" })
  });

  if (r.ok) {
    alert("Adoção confirmada!");
    carregarAdocoes();
  } else {
    alert("Erro ao atualizar.");
  }
}

document.addEventListener("DOMContentLoaded", carregarAdocoes);
