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
function criarCardPonto(ponto) {
    // 1. Formata a data de cadastro
    const dataCadastroFormatada = ponto.data_cadastro
        ? new Date(ponto.data_cadastro).toLocaleDateString('pt-BR')
        : "—";
        
    // 2. Determina a classe do Status
    const statusClass = ponto.status === 'ativo' ? 'text-green-600' : 
                        ponto.status === 'inativo' ? 'text-red-600' :
                        'text-yellow-600'; // Pendente

    return `
        <div class="ponto-coleta-card border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
            <div class="flex flex-col space-y-1">
                <p class="text-lg font-semibold text-gray-900">
                    Nome: <span class="font-normal text-blue-600">${ponto.nome_ponto || 'N/A'}</span>
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">Endereço:</span> ${ponto.endereco || 'N/A'}
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">Responsável:</span> ${ponto.responsavel || 'N/A'}
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">Telefone:</span> ${ponto.telefone || 'N/A'}
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">E-mail:</span> ${ponto.email_ponto || 'N/A'}
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">Horário:</span> ${ponto.horario || 'N/A'}
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">Status:</span> 
                    <span class="${statusClass} font-semibold">${ponto.status.toUpperCase()}</span>
                    
                </p>
                <p class="text-sm text-gray-700">
                    <span class="font-medium">Cadastro:</span> ${dataCadastroFormatada}
                </p>
            </div>
            
            <div class="mt-3 flex space-x-2">
                <button 
                    onclick="editarPonto('${ponto.id_ponto}')"
                    class="px-3 py-1 text-sm bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition duration-150 shadow-sm"
                >
                    Editar
                </button>
                <button 
                    onclick="excluirPonto('${ponto.id_ponto}')"
                    class="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 shadow-sm"
                >
                    Excluir
                </button>
            </div>
        </div>
    `;
}

// -------------------- CARREGAR PONTOS (CORRIGIDO) --------------------
async function carregarPontos() {
    try {
        const res = await fetch("../api/pontosdecoleta");
        const data = await res.json();
        if (!data.sucesso) throw new Error(data.mensagem);

        pontos = data.pontos;
        totalPontos.textContent = pontos.length;

        // Limpa e preenche o corpo da lista de uma vez (melhor performance)
        // Usa map para gerar um array de strings HTML e join('') para concatenar
        tabelaBody.innerHTML = pontos.map(p => criarCardPonto(p)).join('');

    } catch (err) {
        console.error(err);
        tabelaBody.innerHTML = '<p class="p-4 text-center text-red-500">Erro ao carregar pontos. Verifique o console.</p>';
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

    window.scrollTo({
        // Pega a posição vertical do formulário e subtrai a altura do seu cabeçalho (ex: 80px)
        top: formPonto.offsetTop - 80, 
        behavior: 'smooth'
    });
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
            res = await fetch("../api/pontosdecoleta", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            data = await res.json();
            if (!data.sucesso) throw new Error(data.mensagem);
            mostrarCloudinho(`Ponto "${data.ponto.nome_ponto}" atualizado!`);
        } else {
            res = await fetch("../api/pontosdecoleta", {
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
        const res = await fetch("../api/pontosdecoleta", {
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


