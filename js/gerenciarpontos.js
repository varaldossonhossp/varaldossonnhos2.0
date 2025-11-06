const tabelaBody = document.getElementById("pontos-list-body");
const totalPontos = document.getElementById("total-pontos");

const formPonto = document.getElementById("form-ponto");
const btnLimpar = document.getElementById("btn-limpar");

const cloudinho = document.getElementById("cloudinho");
const cloudinhoMensagem = document.getElementById("cloudinho-mensagem");

let pontos = [];
let editandoId = "";

// -------------------- FEEDBACK --------------------
let cloudinhoTimeout;
function mostrarCloudinho(msg, duracao = 2500) {
    clearTimeout(cloudinhoTimeout);
    cloudinhoMensagem.textContent = msg;
    cloudinho.classList.add("ativo");
    cloudinhoTimeout = setTimeout(() => cloudinho.classList.remove("ativo"), duracao);
}

// -------------------- CARREGAR PONTOS --------------------
async function carregarPontos() {
    try {
        const res = await fetch("../api/pontosDeColeta");
        const data = await res.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        pontos = data.pontos;
        totalPontos.textContent = pontos.length;

        tabelaBody.innerHTML = "";

        pontos.forEach(p => {
            const tr = document.createElement("tr");

            // Formata a data de cadastro
            const dataCadastro = p.data_cadastro
                ? new Date(p.data_cadastro).toLocaleDateString('pt-BR')
                : "—";

            // Cria as células
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.nome_ponto}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.endereco}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.responsavel}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.telefone || "—"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.email_ponto || "—"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.horario || "—"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${p.status}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataCadastro}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2"></td>
            `;

            // Botões de ação
            const tdAcoes = tr.querySelector("td:last-child");

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "text-blue-600 hover:text-blue-900";
            btnEditar.addEventListener("click", () => editarPonto(p.id_ponto));

            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.className = "text-red-600 hover:text-red-900";
            btnExcluir.addEventListener("click", () => excluirPonto(p.id_ponto));

            tdAcoes.appendChild(btnEditar);
            tdAcoes.appendChild(btnExcluir);

            tabelaBody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        mostrarCloudinho("Erro ao carregar pontos.");
    }
}

// -------------------- EDITAR --------------------
window.editarPonto = function(id) {
    const ponto = pontos.find(p => p.id_ponto === id);
    if (!ponto) return;

    editandoId = id;
    btnLimpar.style.display = "inline-block";

    formPonto.nome_ponto.value = ponto.nome_ponto;
    formPonto.endereco.value = ponto.endereco;
    formPonto.responsavel.value = ponto.responsavel;
    formPonto.telefone.value = ponto.telefone || "";
    formPonto.email_ponto.value = ponto.email_ponto || "";
    formPonto.horario.value = ponto.horario || "";
    formPonto.status.value = ponto.status || "ativo";
};

// -------------------- LIMPAR --------------------
btnLimpar.addEventListener("click", () => {
    editandoId = "";
    btnLimpar.style.display = "none";
    formPonto.reset();
});

// -------------------- SALVAR --------------------
formPonto.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
        nome_ponto: formPonto.nome_ponto.value,
        endereco: formPonto.endereco.value,
        responsavel: formPonto.responsavel.value,
        telefone: formPonto.telefone.value,
        email_ponto: formPonto.email_ponto.value,
        horario: formPonto.horario.value,
        status: formPonto.status.value,
    };

    try {
        let res, data;

        if (editandoId) {
            payload.id_ponto = editandoId;
            res = await fetch("../api/pontosDeColeta", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            data = await res.json();
            if (!data.sucesso) throw new Error(data.mensagem);
            mostrarCloudinho(`Ponto "${data.ponto.nome_ponto}" atualizado!`);
        } else {
            res = await fetch("../api/pontosDeColeta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            data = await res.json();
            if (!data.sucesso) throw new Error(data.mensagem);
            mostrarCloudinho(`Ponto "${data.ponto.nome_ponto}" criado!`);
        }

        formPonto.reset();
        btnLimpar.style.display = "none";
        editandoId = "";
        carregarPontos();

    } catch (err) {
        console.error(err);
        mostrarCloudinho("Erro ao salvar ponto.");
    }
});

// -------------------- EXCLUIR --------------------
window.excluirPonto = async function(id) {
    if (!confirm("Deseja realmente excluir este ponto?")) return;

    try {
        const res = await fetch("../api/pontosDeColeta", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_ponto: id }),
        });
        const data = await res.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        mostrarCloudinho("Ponto excluído!");
        carregarPontos();
    } catch (err) {
        console.error(err);
        mostrarCloudinho("Erro ao excluir ponto.");
    }
};

// -------------------- INICIALIZAÇÃO --------------------
window.addEventListener("DOMContentLoaded", carregarPontos);


