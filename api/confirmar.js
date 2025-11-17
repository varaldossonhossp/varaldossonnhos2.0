// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js
// ------------------------------------------------------------
// Finalidade:
//  • Admin confirma a adoção
//  • Muda status → "confirmada"
//  • Atualiza gamificação
//  • Envia e-mail ao DOADOR (EmailJS)
//  • Valida se o e-mail foi enviado DE VERDADE
//
// Observação importante:
//  A etapa de confirmação deve ser 100% CONFIÁVEL.
//  Se o e-mail falhar, NÃO confirmamos a adoção.
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
const TB_GAMI = process.env.AIRTABLE_GAMIFICACAO_TABLE || "gamificacao";
const TB_REGRAS = process.env.AIRTABLE_REGRAS_GAMIFICACAO_TABLE || "regras_gamificacao";

// ============================================================
// 💌 Função — Enviar e-mail ao DOADOR via EmailJS
//   → Retorna TRUE se enviado
//   → Retorna FALSE se falhou
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
        pickup_name: params.ponto_nome || "",
        pickup_address: params.ponto_endereco || "",
        pickup_phone: params.ponto_telefone || "",
        order_id: params.order_id,
        deadline: params.deadline || "Verifique seu painel",
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

    // Agora é VERDADEIRAMENTE verificado
    if (!r.ok) {
      console.error("❌ EmailJS falhou:", await r.text());
      return false;
    }

    console.log("✅ Email enviado ao doador com sucesso!");
    return true;

  } catch (err) {
    console.error("🔥 ERRO no envio EmailJS:", err.message);
    return false;
  }
}


// ============================================================
// 🎮 GAMIFICAÇÃO — Atualiza pontos + nível
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

    // Nível inicial
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
// 🌟 PÁGINA DE SUCESSO (HTML SIMPLES)
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
  </body></html>
  `;
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

    // Buscar a adoção
    const registro = await base(TB_ADOCOES).find(idAdocao);
    const f = registro.fields;

    // Se já confirmada → retorna
    if (f.status_adocao === "confirmada") {
      return res.status(200).send(
        paginaSucesso("Esta adoção já estava confirmada.", "#ffa000")
      );
    }

    // Buscar usuário
    const idUsuarioRecord = f.usuario ? f.usuario[0] : null;
    const usuario = idUsuarioRecord ? await base(TB_USUARIO).find(idUsuarioRecord) : null;

    const emailDoador = usuario?.fields?.email_usuario;
    const nomeDoador = usuario?.fields?.nome_usuario;

    // Buscar nome/sonho da criança
    const nomeCrianca = f.nome_crianca || "";
    const sonho = f.sonho || "";

    // Buscar ponto
    const pontoRecord = f.ponto_coleta ? f.ponto_coleta[0] : null;
    let ponto = {};
    if (pontoRecord) {
      const p = await base(TB_PONTOS).find(pontoRecord);
      ponto = {
        nome: p.get("nome_ponto") || "",
        endereco: p.get("endereco") || "",
        telefone: p.get("telefone") || "",
      };
    }

    // Atualizar status
    await base(TB_ADOCOES).update([
      { id: idAdocao, fields: { status_adocao: "confirmada" } },
    ]);

    // Gamificação
    const gami = await atualizarGamificacao(base, idUsuarioRecord, idAdocao);

    // Enviar e-mail
    const enviado = await enviarEmailDoador_EmailJS({
      email_doador: emailDoador,
      nome_doador: nomeDoador,
      nome_crianca: nomeCrianca,
      sonho,
      ponto_nome: ponto.nome,
      ponto_endereco: ponto.endereco,
      ponto_telefone: ponto.telefone,
      order_id: idAdocao,
      ...gami,
    });

    // VERIFICAÇÃO CRÍTICA
    if (!enviado) {
      // Reverte status
      await base(TB_ADOCOES).update([
        { id: idAdocao, fields: { status_adocao: "aguardando confirmacao" } },
      ]);

      return res.status(500).send(
        paginaSucesso(
          "❌ ERRO: A adoção NÃO foi confirmada pois o e-mail falhou.",
          "#d32f2f"
        )
      );
    }

    // Tudo certo
    return res.status(200).send(
      paginaSucesso("Adoção confirmada com sucesso! 💙")
    );

  } catch (err) {
    console.error("🔥 Erro ao confirmar adoção:", err);
    return res.status(500).send(
      paginaSucesso("Erro interno ao confirmar adoção.", "#d32f2f")
    );
  }
}
