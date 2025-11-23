// ============================================================
// 💙 VARAL DOS SONHOS — /js/meu-perfil.js
// ------------------------------------------------------------
// Página "Meu Perfil":
// • Carrega dados do usuário logado (localStorage e/ou API)
// • Permite editar seus dados pessoais
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
  if (!usuario) return;

  const campos = {
    "perfil-nome": usuario.nome,
    "perfil-endereco": usuario.endereco,
    "perfil-numero": usuario.numero,
    "perfil-bairro": usuario.bairro,
    "perfil-cidade": usuario.cidade,
    "perfil-cep": usuario.cep,
    "perfil-telefone": usuario.telefone,
    "perfil-email": usuario.email
  };

  Object.entries(campos).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.value = valor || "";
  });

  const senha = document.getElementById("perfil-senha");
  if (senha) senha.value = "";
}

async function salvarPerfil() {
  const u = obterUsuarioLogado();
  if (!u) {
    alert("⚠️ Nenhum usuário logado.");
    return;
  }

  const payload = {
    id_usuario: u.id_usuario || u.id,
    nome: document.getElementById("perfil-nome").value.trim(),
    endereco: document.getElementById("perfil-endereco").value.trim(),
    numero: document.getElementById("perfil-numero").value.trim(),
    bairro: document.getElementById("perfil-bairro").value.trim(),
    cidade: document.getElementById("perfil-cidade").value.trim(),
    cep: document.getElementById("perfil-cep").value.trim(),
    telefone: document.getElementById("perfil-telefone").value.trim(),
    email: document.getElementById("perfil-email").value.trim()
  };

  const novaSenha = document.getElementById("perfil-senha").value.trim();
  if (novaSenha) payload.senha = novaSenha;

  try {
    const resp = await fetch("/api/usuarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await resp.json();
    if (!resp.ok || json.sucesso === false) {
      alert(json.mensagem || "Erro ao salvar alterações.");
      return;
    }

    // Atualizar localStorage
    const novoUsuario = { ...u, ...payload };
    localStorage.setItem("usuario", JSON.stringify(novoUsuario));

    alert("✅ Perfil atualizado com sucesso!");

  } catch (e) {
    console.error(e);
    alert("Erro ao atualizar perfil.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const usuario = obterUsuarioLogado();
  preencherFormulario(usuario);

  const btn = document.getElementById("btn-salvar-perfil");
  if (btn) btn.addEventListener("click", salvarPerfil);
});
