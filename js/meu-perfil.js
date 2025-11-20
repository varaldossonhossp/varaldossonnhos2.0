// ============================================================
// 💙 VARAL DOS SONHOS — /js/meu-perfil.js
// ------------------------------------------------------------
// Página "Meu Perfil":
// • Carrega dados do usuário logado (localStorage e/ou API)
// • Permite editar nome, email, telefone e senha
// • Salva na tabela "usuarios" via API /api/usuarios (já existente)
// • ATENÇÃO: única página do painel que faz escrita no Airtable
// ============================================================

function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler usuário do localStorage:", e);
    return null;
  }
}

function preencherFormulario(usuario) {
  const campoNome = document.getElementById("perfil-nome");
  const campoEmail = document.getElementById("perfil-email");
  const campoTelefone = document.getElementById("perfil-telefone");
  const campoSenha = document.getElementById("perfil-senha");

  if (campoNome) campoNome.value = usuario.nome || "";
  if (campoEmail) campoEmail.value = usuario.email || "";
  if (campoTelefone) campoTelefone.value = usuario.telefone || "";
  // Por segurança, podemos deixar a senha em branco
  if (campoSenha) campoSenha.value = "";
}

async function salvarPerfil(event) {
  if (event) event.preventDefault();

  const usuarioAtual = obterUsuarioLogado();
  if (!usuarioAtual) {
    alert("⚠️ Nenhum usuário logado. Faça login novamente.");
    return;
  }

  const campoNome = document.getElementById("perfil-nome");
  const campoEmail = document.getElementById("perfil-email");
  const campoTelefone = document.getElementById("perfil-telefone");
  const campoSenha = document.getElementById("perfil-senha");

  const nome = campoNome ? campoNome.value.trim() : "";
  const email = campoEmail ? campoEmail.value.trim() : "";
  const telefone = campoTelefone ? campoTelefone.value.trim() : "";
  const senha = campoSenha ? campoSenha.value.trim() : "";

  if (!nome || !email) {
    alert("⚠️ Nome e e-mail são obrigatórios.");
    return;
  }

  const payload = {
    id_usuario: usuarioAtual.id_usuario || usuarioAtual.id,
    nome,
    email,
    telefone,
    // Enviar senha somente se usuário digitou algo novo
    ...(senha ? { senha } : {})
  };

  try {
    const resp = await fetch("/api/usuarios", {
      method: "PUT", // ajuste se sua API usar POST para update
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await resp.json().catch(() => ({}));

    if (!resp.ok || json.sucesso === false) {
      console.error("Erro ao salvar perfil:", json);
      alert(json.mensagem || "Erro ao salvar perfil. Tente novamente.");
      return;
    }

    // Atualiza localStorage com dados novos
    const novoUsuario = {
      ...usuarioAtual,
      nome,
      email,
      telefone,
      ...(senha ? { senha } : {})
    };

    localStorage.setItem("usuario", JSON.stringify(novoUsuario));

    alert("✅ Perfil atualizado com sucesso!");

  } catch (erro) {
    console.error(erro);
    alert("Erro ao atualizar perfil. Tente novamente.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    alert("⚠️ Faça login para acessar o perfil.");
    return;
  }

  preencherFormulario(usuario);

  const btn = document.getElementById("btn-salvar-perfil");
  if (btn) {
    btn.addEventListener("click", salvarPerfil);
  } else {
    console.warn("Botão #btn-salvar-perfil não encontrado no HTML.");
  }
});
