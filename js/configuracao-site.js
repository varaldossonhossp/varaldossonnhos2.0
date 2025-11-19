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
const CLOUD_NAME  = "drnn5zmxi";          // mesmo usado nas outras telas
const PRESET      = "unsigned_uploads";   // preset público

let configAtual    = null;
let logoUrlAtual   = "";
let nuvemUrlAtual  = "";
let logoUrlNovo    = "";
let nuvemUrlNovo   = "";

// Helpers DOM
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------
// Upload genérico para Cloudinary
// ------------------------------------------------------------
async function uploadImagem(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);

  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: fd,
  });

  if (!r.ok) throw new Error("Falha ao enviar imagem para Cloudinary.");
  const json = await r.json();
  return json.secure_url;
}

// ------------------------------------------------------------
// Máscara de telefone (11 dígitos → (11) 99999-9999)
// ------------------------------------------------------------
function mascaraTelefone(v) {
  let nums = (v || "").replace(/\D/g, "");
  if (nums.length > 11) nums = nums.slice(0, 11);

  if (nums.length <= 10) {
    // (11) 9999-9999
    return nums
      .replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => {
        let r = "";
        if (a) r = "(" + a;
        if (a && a.length === 2) r += ") ";
        if (b) r += b;
        if (b && b.length === 4) r += "-";
        if (c) r += c;
        return r;
      });
  } else {
    // (11) 99999-9999
    return nums
      .replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_, a, b, c) => {
        let r = "";
        if (a) r = "(" + a;
        if (a && a.length === 2) r += ") ";
        if (b) r += b;
        if (b && b.length === 5) r += "-";
        if (c) r += c;
        return r;
      });
  }
}

// ------------------------------------------------------------
// Habilita / desabilita campos para edição
// ------------------------------------------------------------
function setModoEdicao(ativo) {
  document.querySelectorAll("[data-editavel]").forEach(el => {
    el.disabled = !ativo;
  });

  const btnSalvar = $("btnSalvar");
  const btnEditar = $("btnEditar");

  btnSalvar.disabled = !ativo;
  btnEditar.disabled = ativo;
}

// ------------------------------------------------------------
// Preenche o formulário com os dados vindos da API
// ------------------------------------------------------------
function preencherFormulario(cfg) {
  $("nome_ong").value             = cfg.nome_ong || "";
  $("descricao_homepage").value   = cfg.descricao_homepage || "";
  $("instagram_url").value        = cfg.instagram_url || "";
  $("email_contato").value        = cfg.email_contato || "";
  $("telefone_contato").value     = mascaraTelefone(cfg.telefone_contato || "");

  const logoAtt  = Array.isArray(cfg.logo_header) ? cfg.logo_header[0] : null;
  const nuvemAtt = Array.isArray(cfg.nuvem_index) ? cfg.nuvem_index[0] : null;

  logoUrlAtual  = logoAtt && logoAtt.url ? logoAtt.url : "";
  nuvemUrlAtual = nuvemAtt && nuvemAtt.url ? nuvemAtt.url : "";

  $("logoPreview").src  = logoUrlAtual  || "../imagens/logo.png";
  $("nuvemPreview").src = nuvemUrlAtual || "../imagens/nuvem.png";
}

// ------------------------------------------------------------
// Carregar config_site ao abrir a página
// ------------------------------------------------------------
async function carregarConfigSite() {
  try {
    const r = await fetch("/api/admin?tipo=config_site");
    const json = await r.json();

    if (!json.sucesso) {
      $("statusCarregando").textContent = "Erro ao carregar dados.";
      console.error("Erro config_site:", json.mensagem);
      return;
    }

    if (!json.config) {
      configAtual = null;
      $("statusCarregando").textContent = "Nenhuma configuração encontrada. Você pode salvar a primeira agora.";
      setModoEdicao(true);
      return;
    }

    configAtual = json.config;
    preencherFormulario(configAtual);
    $("statusCarregando").style.display = "none";
    setModoEdicao(false);
  } catch (e) {
    console.error(e);
    $("statusCarregando").textContent = "Erro ao carregar dados.";
  }
}

// ------------------------------------------------------------
// Salvar ficha inteira no Airtable
// ------------------------------------------------------------
async function salvarConfiguracao(e) {
  e.preventDefault();

  try {
    const nome_ong            = $("nome_ong").value.trim();
    const descricao_homepage  = $("descricao_homepage").value.trim();
    const instagram_url       = $("instagram_url").value.trim();
    const email_contato       = $("email_contato").value.trim();
    const telefone_contato    = $("telefone_contato").value.trim();

    const logoFinal   = logoUrlNovo   || logoUrlAtual;
    const nuvemFinal  = nuvemUrlNovo  || nuvemUrlAtual;

    const body = {
      acao: "salvar_config_site",
      id: configAtual ? configAtual.id : null,
      dados: {
        nome_ong,
        descricao_homepage,
        instagram_url,
        email_contato,
        telefone_contato,
        logo_url: logoFinal,
        nuvem_index_url: nuvemFinal,
      },
    };

    const resp = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": TOKEN,
      },
      body: JSON.stringify(body),
    });

    const json = await resp.json();

    if (!json.sucesso) {
      alert("Erro ao salvar configuração: " + (json.mensagem || "erro desconhecido"));
      return;
    }

    alert("Configuração salva com sucesso! ✅");

    // Atualiza estado local
    configAtual = {
      ...(configAtual || {}),
      id: json.id,
      nome_ong,
      descricao_homepage,
      instagram_url,
      email_contato,
      telefone_contato,
      logo_header: logoFinal ? [{ url: logoFinal }] : configAtual?.logo_header,
      nuvem_index: nuvemFinal ? [{ url: nuvemFinal }] : configAtual?.nuvem_index,
    };

    logoUrlAtual   = logoFinal;
    nuvemUrlAtual  = nuvemFinal;
    logoUrlNovo    = "";
    nuvemUrlNovo   = "";

    preencherFormulario(configAtual);
    setModoEdicao(false);
  } catch (e) {
    console.error(e);
    alert("Erro inesperado ao salvar configuração.");
  }
}

// ------------------------------------------------------------
// Listeners de upload (logo / nuvem)
// ------------------------------------------------------------
function configurarUploads() {
  const logoInput  = $("logoUpload");
  const nuvemInput = $("nuvemUpload");

  logoInput.addEventListener("change", async () => {
    const file = logoInput.files[0];
    if (!file) return;
    try {
      const url = await uploadImagem(file);
      logoUrlNovo = url;
      $("logoPreview").src = url;
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar logo. Tente novamente.");
    }
  });

  nuvemInput.addEventListener("change", async () => {
    const file = nuvemInput.files[0];
    if (!file) return;
    try {
      const url = await uploadImagem(file);
      nuvemUrlNovo = url;
      $("nuvemPreview").src = url;
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar nuvem animada. Tente novamente.");
    }
  });
}

// ------------------------------------------------------------
// Listener da máscara de telefone
// ------------------------------------------------------------
function configurarMascaraTelefone() {
  const tel = $("telefone_contato");
  tel.addEventListener("input", () => {
    tel.value = mascaraTelefone(tel.value);
  });
}

// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setModoEdicao(false);

  $("btnEditar").addEventListener("click", () => setModoEdicao(true));
  $("form-config").addEventListener("submit", salvarConfiguracao);

  configurarUploads();
  configurarMascaraTelefone();
  carregarConfigSite();
});
