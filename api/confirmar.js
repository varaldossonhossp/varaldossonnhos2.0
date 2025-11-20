// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js 
// ------------------------------------------------------------
// • Admin confirma a adoção
// • Atualiza status → "confirmada"
// • Busca dados completos (cartinha, usuário, ponto)
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
        deadline: params.deadline || "Verifique seu painel",
        pickup_name: params.ponto_nome || "",
        pickup_address: params.ponto_endereco || "",
        pickup_phone: params.ponto_telefone || "",
        order_id: params.order_id,
        gami_points: params.gami_points || 10,
        gami_level: params.gami_level || "Iniciante",
        gami_badge_title: params.gami_badge_title || "",
        gami_next_goal: params.gami_next_goal || "",
      },
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      console.error("❌ EmailJS falhou:", await r.text());
      return false;
    }

    console.log("📨 Email enviado ao doador!");
    return true;

  } catch (err) {
    console.error("🔥 ERRO EMAIL DOADOR:", err.message);
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

    // Busca registro gamificação atual
    const registros = await base(TB_GAMI)
      .select({ filterByFormula: `{usuario}='${idUsuarioRecord}'` })
      .all();

    let registro = registros[0];
    let pontosAtuais = registro ? registro.fields.pontos || 0 : 0;

    // Ganha +10 pontos por adoção
    pontosAtuais += 10;

    // Nível
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
        {
          id: registro.id,
          fields: {
            pontos: pontosAtuais,
            nivel,
            titulo,
            data_atualizacao: new Date().toISOString(),
          },
        },
      ]);
    } else {
      await base(TB_GAMI).create([
        {
          fields: {
            usuario: [idUsuarioRecord],
            pontos: pontosAtuais,
            nivel,
            titulo,
            adocoes: [idAdocao],
            data_atualizacao: new Date().toISOString(),
          },
        },
      ]);
    }

    return {
      gami_level: nivel,
      gami_points: pontosAtuais,
      gami_badge_title: titulo,
      gami_next_goal: "Continue espalhando sonhos! 💙",
    };

  } catch (err) {
    console.error("⚠️ Erro Gamificação:", err);
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

    // ----------------------------
    // 1) Buscar ADOÇÃO
    // ----------------------------
    const registro = await base(TB_ADOCOES).find(idAdocao);
    const f = registro.fields;

    if (f.status_adocao === "confirmada") {
      return res.status(200).send(
        paginaSucesso("Esta adoção já estava confirmada.", "#ffa000")
      );
    }

    // ----------------------------
    // 2) Buscar USUÁRIO
    // ----------------------------
    const idUsuarioRecord = f.usuario ? f.usuario[0] : null;
    const usuario = idUsuarioRecord ? await base(TB_USUARIO).find(idUsuarioRecord) : null;

    const emailDoador = usuario?.fields?.email_usuario || "";
    const nomeDoador = usuario?.fields?.nome_usuario || "";

    // ----------------------------
    // 3) Buscar CARTINHA
    // ----------------------------
    const idCartinhaRecord = f.cartinha ? f.cartinha[0] : null;
    const cart = idCartinhaRecord ? await base(TB_CARTINHA).find(idCartinhaRecord) : null;

    const nomeCrianca = cart?.fields?.nome_crianca || "";
    const sonho = cart?.fields?.sonho || "";
    const id_cartinha = cart?.fields?.id_cartinha || idCartinhaRecord;
    const deadline = cart?.fields?.data_limite_recebimento || "";

    // ----------------------------
    // 4) Buscar PONTO DE COLETA
    // ----------------------------
    const idPonto = f.pontos_coleta ? f.pontos_coleta[0] : null;
    let ponto = {};

    if (idPonto) {
      const p = await base(TB_PONTOS).find(idPonto);
      ponto = {
        nome: p.get("nome_ponto") || "",
        endereco: p.get("endereco") || "",
        telefone: p.get("telefone") || "",
      };
    }

    // ----------------------------
    // Atualizar STATUS
    // ----------------------------
    await base(TB_ADOCOES).update([
      { id: idAdocao, fields: { status_adocao: "confirmada" } },
    ]);

    // ----------------------------
    // GAMIFICAÇÃO
    // ----------------------------
    const gami = await atualizarGamificacao(base, idUsuarioRecord, idAdocao);

    // ----------------------------
    // ENVIAR E-MAIL AO DOADOR
    // ----------------------------
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
      order_id: idAdocao,
      ...gami,
    });

    if (!enviado) {
      await base(TB_ADOCOES).update([
        { id: idAdocao, fields: { status_adocao: "aguardando confirmacao" } },
      ]);

      return res.status(500).send(
        paginaSucesso(
          "❌ ERRO: O e-mail falhou e a adoção NÃO foi confirmada.",
          "#d32f2f"
        )
      );
    }

    // Sucesso!
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
