// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js (versão final TCC revisada)
// ------------------------------------------------------------
// ✅ Confirma a adoção (status → "confirmada")
// ✅ Atualiza pontuação e conquistas de gamificação
// ✅ Envia e-mail de confirmação ao DOADOR (EmailJS).
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ============================================================
// 🗂️ IDs das tabelas confirmadas
// ============================================================
const T_ADOCOES = "tblXJ8mMNje3GS4kQ";
const T_GAMIFICACAO = "tblNNFoE0DmpbHqtP";
const T_REGRAS_GAMI = "tblxgqmroyCFr6AxS";
const T_PONTOS_COLETA = "tblewxsBHMOvo3uUG";

// Campos da tabela ADOCOES
const A_STATUS_ADOCAO = "fldFdV5OHkLkReHw3"; // Single select
const A_LNK_USUARIO = "fldhbnWIGiIVKS8na"; // Linked → usuario
const A_LKP_EMAIL = "fldo4yh3bKb6NWadp";
const A_LKP_NOME_DOADOR = "fldmvJ8fGtoVafHDR";
const A_LKP_NOME_CRIANCA = "fld02fhfJimXlmArF";
const A_LKP_SONHO = "fldUGeiXoh7vYDTvg";
const A_LNK_PONTO_COLETA = "fldNw32NarsI4wTux";

// Campos da tabela GAMIFICAÇÃO
const G_LNK_USUARIO = "fldm0YnARcMp65GeZ";
const G_LNK_ADOCOES = "fldmOJL6RQmyGiFJM";
const G_PONTOS = "fld9hKwac7EvJncSn";
const G_NIVEL = "fldHBqawGaG2yf9j6";
const G_TITULO = "fldjQ0CEDJlFQgkkl";
const G_DATA_ATUALIZACAO = "fldVyEMlYKpPG8nOg";

// Campos da tabela REGRAS GAMIFICAÇÃO
const R_FAIXA_MIN = "fldssb1r2VTBXMb7R";
const R_NIVEL = "fldPPxSf4O6RXT9uw";
const R_TITULO = "fld8sx4c25P1rgBJ3";

// ============================================================
// 💌 Envio de e-mail ao DOADOR
// ============================================================
async function enviarEmailDoador(params) {
  try {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_DONOR_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;
    const adminEmail = process.env.EMAILJS_ADMIN_EMAIL || "varaldossonhossp@gmail.com";

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      throw new Error("Variáveis EmailJS ausentes ou incorretas.");
    }

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: params.email_doador || adminEmail, // fallback seguro
        to_name: params.nome_doador,
        child_name: params.nome_crianca,
        child_gift: params.sonho,
        pickup_name: params.ponto_coleta?.nome || "",
        pickup_address: params.ponto_coleta?.endereco || "",
        pickup_phone: params.ponto_coleta?.telefone || "",
        gami_level: params.gami_level || "Iniciante",
        gami_points: params.gami_points || 10,
        gami_badge_title: params.gami_badge_title || "💙 Iniciante Solidário",
        gami_next_goal: params.gami_next_goal || "Adote mais uma cartinha para subir de nível!",
        deadline: params.deadline || "Verifique na plataforma",
        order_id: params.order_id || "N/A",
      },
    };

    const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 🧠 Log e verificação aprimorada
    if (!emailResp.ok) {
      console.error("❌ Falha ao enviar e-mail:", await emailResp.text());
      throw new Error("Erro no envio via EmailJS");
    }

    console.log("✅ E-mail de confirmação enviado ao doador com sucesso!");
  } catch (err) {
    console.error("🔥 Erro ao enviar e-mail ao doador:", err.message);
  }
}

// ============================================================
// 🎮 Atualiza pontuação na tabela gamificação
// ============================================================
async function atualizarGamificacao(base, idUsuarioRecord, idAdocao) {
  try {
    const regras = await base(T_REGRAS_GAMI)
      .select({ sort: [{ field: R_FAIXA_MIN, direction: "asc" }] })
      .all();

    const registros = await base(T_GAMIFICACAO)
      .select({ filterByFormula: `{${G_LNK_USUARIO}}='${idUsuarioRecord}'` })
      .all();

    let registro = registros[0];
    let pontosAtuais = registro ? registro.fields[G_PONTOS] || 0 : 0;
    pontosAtuais += 10;

    let nivel = "Iniciante";
    let titulo = "💙 Iniciante Solidário";
    const adocoes = (registro?.fields[G_LNK_ADOCOES] || []).length + 1;

    for (const r of regras) {
      const faixa = r.fields[R_FAIXA_MIN];
      if (adocoes >= faixa) {
        nivel = r.fields[R_NIVEL];
        titulo = r.fields[R_TITULO];
      }
    }

    if (registro) {
      await base(T_GAMIFICACAO).update([
        {
          id: registro.id,
          fields: {
            [G_PONTOS]: pontosAtuais,
            [G_NIVEL]: nivel,
            [G_TITULO]: titulo,
            [G_DATA_ATUALIZACAO]: new Date().toISOString(),
          },
        },
      ]);
    } else {
      await base(T_GAMIFICACAO).create([
        {
          fields: {
            [G_LNK_USUARIO]: [idUsuarioRecord],
            [G_PONTOS]: 10,
            [G_NIVEL]: nivel,
            [G_TITULO]: titulo,
            [G_LNK_ADOCOES]: [idAdocao],
            [G_DATA_ATUALIZACAO]: new Date().toISOString(),
          },
        },
      ]);
    }

    return {
      gami_level: nivel,
      gami_points: pontosAtuais,
      gami_badge_title: titulo,
      gami_next_goal: "Continue ajudando para subir de nível!",
    };
  } catch (err) {
    console.error("⚠️ Erro na gamificação:", err.message);
    return {};
  }
}

// ============================================================
// 🧩 Página de sucesso exibida ao admin
// ============================================================
function paginaSucesso(mensagem, cor = "#1f6fe5") {
  return `
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Confirmação de Adoção</title>
      <style>
        body { font-family: 'Poppins', sans-serif; background:#f0f7ff; text-align:center; padding:60px; }
        .card { background:#fff; border-radius:16px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,.1); display:inline-block; }
        h1 { color:${cor}; font-size:22px; margin-bottom:10px; }
        a { background:${cor}; color:#fff; text-decoration:none; padding:10px 18px; border-radius:20px; display:inline-block; margin-top:20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${mensagem}</h1>
        <p>Adoção confirmada e e-mail enviado ao doador 💙</p>
        <a href="/pages/admin.html">Voltar ao painel</a>
      </div>
    </body>
  </html>`;
}

// ============================================================
// 🌟 Handler principal
// ============================================================
export default async function handler(req, res) {
  const idAdocao = req.query.id_adocao || req.body?.id_adocao;
  if (!idAdocao) return res.status(400).json({ sucesso: false, mensagem: "ID da adoção ausente." });

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const registro = await base(T_ADOCOES).find(idAdocao);
    const f = registro.fields;

    if (f[A_STATUS_ADOCAO] === "confirmada") {
      return res.status(200).send(paginaSucesso("Esta adoção já foi confirmada anteriormente.", "#ffc107"));
    }

    // Atualiza status → confirmada
    await base(T_ADOCOES).update([{ id: idAdocao, fields: { [A_STATUS_ADOCAO]: "confirmada" } }]);
    console.log(`✅ Adoção ${idAdocao} confirmada.`);

    const idUsuarioRecord = Array.isArray(f[A_LNK_USUARIO]) ? f[A_LNK_USUARIO][0] : null;
    const emailDoador = Array.isArray(f[A_LKP_EMAIL]) ? f[A_LKP_EMAIL][0] : "";
    const nomeDoador = Array.isArray(f[A_LKP_NOME_DOADOR]) ? f[A_LKP_NOME_DOADOR][0] : "";
    const childName = Array.isArray(f[A_LKP_NOME_CRIANCA]) ? f[A_LKP_NOME_CRIANCA][0] : "";
    const childGift = Array.isArray(f[A_LKP_SONHO]) ? f[A_LKP_SONHO][0] : "";

    // Ponto de coleta
    let pontoColeta = {};
    if (Array.isArray(f[A_LNK_PONTO_COLETA]) && f[A_LNK_PONTO_COLETA][0]) {
      const ponto = await base(T_PONTOS_COLETA).find(f[A_LNK_PONTO_COLETA][0]);
      pontoColeta = {
        nome: ponto.get("nome_ponto") || "",
        endereco: ponto.get("endereco") || "",
        telefone: ponto.get("telefone") || "",
      };
    }

    const gamificacao = await atualizarGamificacao(base, idUsuarioRecord, idAdocao);

    await enviarEmailDoador({
      nome_doador: nomeDoador,
      email_doador: emailDoador,
      nome_crianca: childName,
      sonho: childGift,
      ponto_coleta: pontoColeta,
      order_id: idAdocao,
      ...gamificacao,
    });

    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(paginaSucesso("Adoção Confirmada com Sucesso!"));
    }

    res.status(200).json({ sucesso: true, mensagem: "Adoção confirmada e e-mail enviado." });
  } catch (err) {
    console.error("🔥 Erro ao confirmar adoção:", err);
    res.status(500).send(paginaSucesso("Erro interno ao confirmar adoção.", "#dc3545"));
  }
}
