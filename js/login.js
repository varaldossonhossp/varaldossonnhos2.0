// ============================================================
// 🔑 VARAL DOS SONHOS — /js/login.js
// ------------------------------------------------------------
// Lógica para realizar o login e armazenar dados de sessão.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const feedbackMsg = document.getElementById("feedback-msg");
    if (!form) return;

    // Função auxiliar para feedback
    const exibirFeedback = (mensagem, tipo = 'sucesso') => {
        feedbackMsg.textContent = mensagem;
        feedbackMsg.className = `feedback ${tipo}`;
        feedbackMsg.classList.remove('hidden');

        setTimeout(() => {
            feedbackMsg.classList.add('hidden');
        }, 5000);
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        feedbackMsg.classList.add('hidden');

        // 1. Captura dos dados
        const email = document.getElementById("email")?.value.trim();
        const senha = document.getElementById("senha")?.value.trim();

        if (!email || !senha) {
            exibirFeedback("Por favor, preencha o e-mail e a senha.", 'erro');
            return;
        }

        // Desabilita o botão
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verificando...';

        try {
            // 2. Envio para a API de Usuários (usando GET para login)
            const params = new URLSearchParams({ email, senha });
            const resp = await fetch(`/api/usuarios?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            const data = await resp.json();

            if (!resp.ok || !data.sucesso) {
                // Erro 401 (Não autorizado - Senha incorreta/usuário não encontrado)
                exibirFeedback(data.mensagem || "Credenciais inválidas. Tente novamente.", 'erro');
                return;
            }

            // 3. Login BEM-SUCEDIDO: Salvar dados no localStorage
            const usuario = data.usuario;
            const id_usuario = data.id_usuario; // O ID real do Airtable

            // Salvando os dados essenciais para uso em outras páginas (ex: Carrinho)
            localStorage.setItem('id_usuario_varal', id_usuario);
            localStorage.setItem('nome_usuario_varal', usuario.nome_usuario);
            localStorage.setItem('email_usuario_varal', usuario.email_usuario);
            localStorage.setItem('tipo_usuario_varal', usuario.tipo_usuario);
            
            exibirFeedback(`🎉 Bem-vindo, ${usuario.nome_usuario.split(' ')[0]}! Redirecionando...`, 'sucesso');
            form.reset();
            
            // 4. Redirecionamento baseado no tipo de usuário (Exemplo)
            let redirectUrl = "../index.html"; // Padrão: Homepage

            if (usuario.tipo_usuario === 'administrador' || usuario.tipo_usuario === 'voluntario') {
                redirectUrl = "admin.html"; // Redireciona admins/voluntários para o painel
            } 
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);

        } catch (err) {
            console.error("Erro de rede:", err);
            exibirFeedback("Erro de conexão. Tente novamente mais tarde.", 'erro');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
});