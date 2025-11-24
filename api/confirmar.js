// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js 
// ------------------------------------------------------------
// • Admin confirma a adoção
// • Atualiza status → "confirmada"
// • Busca dados completos (cartinha, usuário, ponto)
// • Pega horário do ponto via LOOKUP
// • Atualiza gamificação
// • Envia e-mail ao doador via EmailJS
// • Se o envio falhar → status NÃO muda
// ============================================================

import Airtable from "airtable";
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

// ===============================
// 🗂️ Tabelas usadas
// ===============================
const TB_ADOCOES = process.env.AIRTABLE_ADOCOES_TABLE || "adocoes";
const TB_USUARIO = process.env.AIRTABLE_USUARIO_TABLE || "usuario";
const TB_PONTOS = process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta";
const TB_CARTINHA = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";
const TB_GAMI = process.env.AIRTABLE_GAMIFICACAO_TABLE || "gamificacao";
const TB_REGRAS = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

// ============================================================
// 💌 Enviar e-mail ao doador via EmailJS
// ============================================================
async function enviarEmailDoador_EmailJS(params) {
  try {
    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_DONOR_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: params.email_doador,
        to_name: params.nome_doador,
        child_name: params.nome_crianca,
        child_gift: params.sonho,
        id_cartinha: params.id_cartinha,
        deadline: params.deadline,
        pickup_name: params.ponto_nome,
        pickup_address: params.ponto_endereco,
        pickup_phone: params.ponto_telefone,
        pickup_hours: params.ponto_horario,   // ← CORRIGIDO
        order_id: params.order_id,
      },
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) return false;
    return true;

  } catch (err) {
    console.error("🔥 ERRO EMAIL DOADOR:", err);
    return false;
  }
}

// ============================================================
// 🎮 GAMIFICAÇÃO
// ============================================================
async function atualizarGamificacao(base, idUsuarioRecord, idAdocao) {
  try {
    const regras = await base(TB_REGRAS)
      .select({ sort: [{ field: "faixa_min", direction: "asc" }] })
      .all();

    const registros = await base(TB_GAMI)
      .select({ filterByFormula: `{usuario}='${idUsuarioRecord}'` })
      .all();

    let registro = registros[0];
    let pontosAtuais = registro ? registro.fields.pontos || 0 : 0;
    pontosAtuais += 10;

    let nivel = "Iniciante";
    let titulo = "💙 Iniciante Solidário";
    const adocoesQnt = (registro?.fields?.adocoes || []).length + 1;

    for (const r of regras) {
      if (adocoesQnt >= r.fields.faixa_min) {
        nivel = r.fields.nivel;
        titulo = r.fields.titulo;
      }
    }

    if (registro) {
      await base(TB_GAMI).update([
        { id: registro.id, fields: {
          pontos: pontosAtuais, nivel, titulo,
          data_atualizacao: new Date().toISOString(),
        }},
      ]);
    } else {
      await base(TB_GAMI).create([
        { fields: {
          usuario: [idUsuarioRecord],
          pontos: pontosAtuais,
          nivel, titulo,
          adocoes: [idAdocao],
          data_atualizacao: new Date().toISOString(),
        }},
      ]);
    }

    return {
      gami_level: nivel,
      gami_points: pontosAtuais,
      gami_badge_title: titulo,
      gami_next_goal: "Continue espalhando sonhos! 💙",
    };

  } catch {
    return {};
  }
}

// ============================================================
// 🌟 HTML de retorno
// ============================================================
function paginaSucesso(msg, cor = "#1e88e5") {
  return `
  <html><body style="font-family:Arial;background:#f0f7ff;padding:50px;text-align:center">
    <div style="background:white;padding:40px;border-radius:14px;display:inline-block">
      <h2 style="color:${cor}">${msg}</h2>
      <p>Adoção confirmada e e-mail enviado ao doador 💙</p>
      <a href="/pages/logistica-admin.html"
         style="display:inline-block;margin-top:20px;background:${cor};
                color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
         Voltar ao Painel
      </a>
    </div>
  </body></html>`;
}

// ============================================================
// 🌟 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {

  const idAdocao = req.query.id_adocao;

  if (!idAdocao)
    return res.status(400).json({ sucesso: false, mensagem: "ID da adoção ausente." });

  try {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID);

    // 1️⃣ Buscar adoção
    const registro = await base(TB_ADOCOES).find(idAdocao);
    const f = registro.fields;

    if (f.status_adocao === "confirmada") {
      return res.status(200).send(
        paginaSucesso("Esta adoção já estava confirmada.", "#ffa000")
      );
    }

    // 2️⃣ Buscar usuário
    const idUsuario = f.usuario?.[0];
    const usuario = idUsuario ? await base(TB_USUARIO).find(idUsuario) : null;

    const emailDoador = usuario?.fields?.email_usuario || "";
    const nomeDoador = usuario?.fields?.nome_usuario || "";

    // 3️⃣ Buscar cartinha
    const idCartinha = f.cartinha?.[0];
    const cart = idCartinha ? await base(TB_CARTINHA).find(idCartinha) : null;

    const nomeCrianca = cart?.fields?.nome_crianca || "";
    const sonho = cart?.fields?.sonho || "";
    const id_cartinha = cart?.fields?.id_cartinha || idCartinha;
    const deadline = f["data_limite_recebimento (from eventos)"]?.[0] || "";

    // 4️⃣ Buscar ponto de coleta (inclui horário)
    const idPonto = f.pontos_coleta?.[0];
    let ponto = {};

    if (idPonto) {
      const p = await base(TB_PONTOS).find(idPonto);
      ponto = {
        nome: p.fields.nome_ponto || "",
        endereco: p.fields.endereco || "",
        telefone: p.fields.telefone || "",
        horario: p.fields.horario || "",   // ← LOOKUP funcionando!
      };
    }

    // 5️⃣ Atualizar status somente DEPOIS do e-mail
    const gami = await atualizarGamificacao(base, idUsuario, idAdocao);

    const enviado = await enviarEmailDoador_EmailJS({
      email_doador: emailDoador,
      nome_doador: nomeDoador,
      nome_crianca: nomeCrianca,
      sonho,
      id_cartinha,
      deadline,
      ponto_nome: ponto.nome,
      ponto_endereco: ponto.endereco,
      ponto_telefone: ponto.telefone,
      ponto_horario: ponto.horario,   // ← usado no template
      order_id: idAdocao,
      ...gami,
    });

    if (!enviado) {
      return res.status(500).send(
        paginaSucesso(
          "❌ ERRO: O e-mail falhou e a adoção NÃO foi confirmada.",
          "#d32f2f"
        )
      );
    }

    // Agora sim confirma
    await base(TB_ADOCOES).update([
      { id: idAdocao, fields: { status_adocao: "confirmada" } },
    ]);

    // 6️⃣ Resposta final
    return res.status(200).send(
      paginaSucesso("Adoção confirmada com sucesso! 💙")
    );

  } catch (err) {
    console.error("🔥 ERRO AO CONFIRMAR ADOÇÃO:", err);
    return res.status(500).send(
      paginaSucesso("Erro interno ao confirmar adoção.", "#d32f2f")
    );
  }
}
