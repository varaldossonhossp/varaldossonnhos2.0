// ============================================================
// 👥 VARAL DOS SONHOS — /js/cadastro.js
// ------------------------------------------------------------
// Lógica de manipulação do formulário de cadastro.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formCadastro");
    const feedbackMsg = document.getElementById("feedback-msg");
    if (!form) return;

    const exibirFeedback = (mensagem, tipo = 'sucesso') => {
        feedbackMsg.textContent = mensagem;
        feedbackMsg.className = `feedback ${tipo}`;
        feedbackMsg.classList.remove('hidden');

        // Esconde a mensagem após 5 segundos
        setTimeout(() => {
            feedbackMsg.classList.add('hidden');
        }, 5000);
    };

    // ============================================================
    // 🧭 Auto-preenchimento de endereço pelo CEP (ViaCEP)
    // ============================================================
    const cepInput = document.getElementById("cep");
    if (cepInput) {
        cepInput.addEventListener("blur", async () => {
            const cep = cepInput.value.replace(/\D/g, "");
            if (cep.length !== 8) return; // ignora CEP inválido

            try {
                const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                if (!resp.ok) return;
                const dados = await resp.json();
                if (dados.erro) return;

                const enderecoInput = document.getElementById("endereco");
                const cidadeInput = document.getElementById("cidade");
                if (enderecoInput)
                    enderecoInput.value = [dados.logradouro, dados.bairro].filter(Boolean).join(" - ");
                if (cidadeInput)
                    cidadeInput.value = [dados.localidade, dados.uf].filter(Boolean).join("/");
            } catch (e) {
                console.warn("Erro ao buscar CEP:", e);
            }
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Limpa o feedback anterior
        feedbackMsg.classList.add('hidden');

        // 1. Captura dos dados do formulário
        const nome_usuario = document.getElementById("nome_usuario")?.value.trim();
        const cep = document.getElementById("cep")?.value.trim();
        const endereco = document.getElementById("endereco")?.value.trim();
        const numero = document.getElementById("numero")?.value.trim();
        const cidade = document.getElementById("cidade")?.value.trim();
        const email_usuario = document.getElementById("email_usuario")?.value.trim();
        const telefone = document.getElementById("telefone")?.value.trim();
        const tipo_usuario = document.getElementById("tipo_usuario")?.value;
        const senha = document.getElementById("senha")?.value.trim();

        // 2. Validação simples
        if (!nome_usuario || !cep || !endereco || !cidade || !email_usuario || !telefone || !tipo_usuario || !senha) {
            exibirFeedback("Por favor, preencha todos os campos obrigatórios.", 'erro');
            return;
        }

        const payload = {
            nome_usuario,
            cep,
            endereco,
            numero,
            cidade,
            email_usuario,
            telefone,
            tipo_usuario,
            senha
        };

        // Desabilita o botão para evitar cliques duplicados
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cadastrando...';

        try {
            // 3. Envio para a API de Usuários
            const resp = await fetch("/api/usuarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // Tenta interpretar como JSON; se falhar, lê como texto
            let data;
            try {
                data = await resp.json();
            } catch {
                const texto = await resp.text();
                console.error("Resposta não JSON:", texto);
                throw new Error("Resposta inesperada do servidor");
            }

            if (!resp.ok) {
                // Mensagens mais específicas conforme backend
                if (resp.status === 409) {
                    exibirFeedback(data.mensagem || "E-mail ou telefone já cadastrados.", 'erro');
                } else {
                    exibirFeedback(data.mensagem || "Erro ao cadastrar usuário. Tente novamente.", 'erro');
                }
                return;
            }

            // 4. Sucesso!
            exibirFeedback("🎉 Cadastro realizado com sucesso! Redirecionando para o Login...", 'sucesso');
            form.reset();
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (err) {
            console.error("Erro de rede:", err);
            exibirFeedback("Erro de conexão. Verifique sua internet e tente novamente.", 'erro');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar';
        }
    });
});
