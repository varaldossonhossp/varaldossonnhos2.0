// ============================================================
// ⚙️ VARAL DOS SONHOS — /js/configuracao-site.js
// ------------------------------------------------------------
// Controla a tela de configuração geral do site:
// • Carrega dados da tabela config_site
// • Exibe logo e nuvem animada já cadastradas
// • Permite editar todos os campos em uma ficha única
// • Faz upload da logo e da nuvem para Cloudinary
// • Salva na API /api/admin (acao="salvar_config_site")
// • Aplica máscara no telefone
// ============================================================

const TOKEN       = "varaladmin";
const CLOUD_NAME  = "drnn5zmxi";
const PRESET      = "unsigned_uploads";

let configAtual    = null;
let logoUrlAtual   = "";
let nuvemUrlAtual  = "";
let logoUrlNovo    = "";
let nuvemUrlNovo   = "";

// Helper
const $ = (id) => document.getElementById(id);

// ===================================================================
// UPLOAD CLOUDINARY (igual cartinhas)
// ===================================================================
async function uploadImagem(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);

  const r = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd }
  );

  if (!r.ok) throw new Error("Falha no upload Cloudinary");
  const json = await r.json();
  return json.secure_url;
}

// ===================================================================
// Máscara telefone
// ===================================================================
function mascaraTelefone(v) {
  let nums = (v || "").replace(/\D/g, "");
  if (nums.length > 11) nums = nums.slice(0, 11);

  if (nums.length <= 10) {
    return nums.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_, a, b, c) => (a ? `(${a}` : "") +
        (a?.length === 2 ? ") " : "") +
        (b || "") +
        (b?.length === 4 ? "-" : "") +
        (c || "")
    );
  } else {
    return nums.replace(
      /^(\d{0,2})(\d{0,5})(\d{0,4}).*/,
      (_, a, b, c) => (a ? `(${a}` : "") +
        (a?.length === 2 ? ") " : "") +
        (b || "") +
        (b?.length === 5 ? "-" : "") +
        (c || "")
    );
  }
}

// ===================================================================
// Modo edição
// ===================================================================
function setModoEdicao(ativo) {
  document.querySelectorAll("[data-editavel]").forEach(el => {
    el.disabled = !ativo;
  });

  $("btnSalvar").disabled = !ativo;
  $("btnEditar").disabled = ativo;
}

// ===================================================================
// Preencher formulário
// ===================================================================
function preencherFormulario(cfg) {
  $("nome_ong").value           = cfg.nome_ong || "";
  $("descricao_homepage").value = cfg.descricao_homepage || "";
  $("instagram_url").value      = cfg.instagram_url || "";
  $("email_contato").value      = cfg.email_contato || "";
  $("telefone_contato").value   = mascaraTelefone(cfg.telefone_contato || "");

  const logoAtt  = Array.isArray(cfg.logo_header) ? cfg.logo_header[0] : null;
  const nuvemAtt = Array.isArray(cfg.nuvem_index) ? cfg.nuvem_index[0] : null;

  logoUrlAtual  = logoAtt?.url  || "";
  nuvemUrlAtual = nuvemAtt?.url || "";

  $("logoPreview").src  = logoUrlAtual  || "../imagens/logo.png";
  $("nuvemPreview").src = nuvemUrlAtual || "../imagens/nuvem.png";
}

// ===================================================================
// Carregar config_site
// ===================================================================
async function carregarConfigSite() {
  try {
    const r = await fetch("/api/admin?tipo=config_site");
    const json = await r.json();

    if (!json.sucesso) {
      $("statusCarregando").textContent = "Erro ao carregar.";
      return;
    }

    if (!json.config) {
      $("statusCarregando").textContent = "Nenhuma configuração cadastrada.";
      setModoEdicao(true);
      return;
    }

    configAtual = json.config;
    preencherFormulario(json.config);

    $("statusCarregando").style.display = "none";
    setModoEdicao(false);

  } catch (e) {
    console.error("Erro:", e);
  }
}

// ===================================================================
// SALVAR CONFIGURAÇÃO — CORRIGIDO
// ===================================================================
async function salvarConfiguracao(e) {
  e.preventDefault();

  try {
    const body = {
      acao: "salvar_config_site",
      dados: {
        nome_ong: $("nome_ong").value.trim(),
        descricao_homepage: $("descricao_homepage").value.trim(),
        instagram_url: $("instagram_url").value.trim(),
        email_contato: $("email_contato").value.trim(),
        telefone_contato: $("telefone_contato").value.trim(),

        // 🔥 AGORA ESTÁ CORRETO PARA A API
        logo_header: logoUrlNovo || logoUrlAtual,
        nuvem_index: nuvemUrlNovo || nuvemUrlAtual,
      }
    };

    const resp = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": TOKEN
      },
      body: JSON.stringify(body)
    });

    const json = await resp.json();

    if (!json.sucesso) {
      alert("Erro ao salvar: " + json.mensagem);
      return;
    }

    alert("Configuração salva com sucesso!");

    logoUrlAtual  = body.dados.logo_header;
    nuvemUrlAtual = body.dados.nuvem_index;

    logoUrlNovo  = "";
    nuvemUrlNovo = "";

    preencherFormulario(body.dados);
    setModoEdicao(false);

  } catch (e) {
    console.error(e);
    alert("Erro ao salvar.");
  }
}

// ===================================================================
// Uploads cloudinary
// ===================================================================
function configurarUploads() {
  $("logoUpload").addEventListener("change", async () => {
    const f = logoUpload.files[0];
    if (!f) return;
    const url = await uploadImagem(f);
    logoUrlNovo = url;
    $("logoPreview").src = url;
  });

  $("nuvemUpload").addEventListener("change", async () => {
    const f = nuvemUpload.files[0];
    if (!f) return;
    const url = await uploadImagem(f);
    nuvemUrlNovo = url;
    $("nuvemPreview").src = url;
  });
}

// ===================================================================
document.addEventListener("DOMContentLoaded", () => {
  setModoEdicao(false);

  $("btnEditar").addEventListener("click", () => setModoEdicao(true));
  $("form-config").addEventListener("submit", salvarConfiguracao);

  configurarUploads();
  carregarConfigSite();
});
