// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js (versão final TCC)
// ------------------------------------------------------------
// • Confirma a adoção (status → "confirmada")
// • Envia e-mail de confirmação ao DOADOR (EmailJS)
// • Atualiza pontuação de gamificação no Airtable
// ------------------------------------------------------------
// Tabelas usadas:
//   - adocoes
//   - usuario
//   - cartinha
//   - pontos_coleta
//   - gamificacao
//   - regras_gamificacao
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ============================================================
// 💌 Função auxiliar – Envio de e-mail ao DOADOR (EmailJS)
// ============================================================
async function enviarEmailDoador(params) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID_DOADOR;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.error("⚠️ Variáveis EmailJS ausentes ou incorretas.");
    return;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey, // ✅ correção — modo server-side
    template_params: {
      to_name: params.nome_doador || "Doador",
      to_email: params.email_doador || "",
      child_name: params.nome_crianca || "",
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      pickup_map_url: params.ponto_coleta?.mapa_url || "",
      gami_level: params.gami_level || 1,
      gami_points: params.gami_points || 10,
      gami_badge_title: params.gami_badge_title || "💙 Iniciante Solidário",
      gami_next_goal:
        params.gami_next_goal || "Adote mais uma cartinha para subir de nível!",
    },
  };

  console.log("📦 Enviando payload EmailJS:", JSON.stringify(payload, null, 2));

  try {
    const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const respText = await emailResp.text();
    console.log("📧 Resposta EmailJS:", emailResp.status, respText);

    if (!emailResp.ok) throw new Error(respText);
    console.log("✅ E-mail de confirmação enviado ao doador.");
  } catch (err) {
    console.error("🔥 Erro ao enviar e-mail ao doador:", err.message);
  }
}

// ============================================================
// 🎮 Função Central — Atualização de Gamificação
// ============================================================
async function atualizarGamificacao(base, idUsuario) {
  let gamiData = {
    gami_level: 1,
    gami_points: 10,
    gami_badge_title: "💙 Iniciante Solidário",
    gami_next_goal: "Adote 2 cartinhas para o próximo nível.",
  };

  try {
    // 1️⃣ Busca regras e gamificação atual
    const [regrasResp, doadorResp] = await Promise.all([
      base("regras_gamificacao")
        .select({ sort: [{ field: "faixa_adocoes_min", direction: "asc" }] })
        .all(),
      base("gamificacao")
        .select({ filterByFormula: `{id_usuario}='${idUsuario}'` })
        .all(),
    ]);

    const regras = regrasResp.map((r) => r.fields);
    const registroExistente = doadorResp[0];
    const pontosAtuais = registroExistente?.fields?.pontos_coracao || 0;
    const adocoesAtuais = registroExistente?.fields?.total_cartinhas_adotadas || 0;
    const idRegistro = registroExistente?.id;

    // 2️⃣ Cálculo de pontos e adoções
    const novosPontos = pontosAtuais + 10;
    const novasAdocoes = adocoesAtuais + 1;

    // 3️⃣ Determina nível e próxima meta
    let nivelAtual = regras[0];
    let metaProxima = regras[1];
    for (let i = 0; i < regras.length; i++) {
      if (novasAdocoes >= regras[i].faixa_adocoes_min) {
        nivelAtual = regras[i];
        metaProxima = regras[i + 1] || null;
      }
    }

    gamiData = {
      gami_level: nivelAtual.nivel_gamificacao || 1,
      gami_points: novosPontos,
      gami_badge_title: nivelAtual.titulo_conquista || "💙 Iniciante Solidário",
      gami_next_goal: metaProxima
        ? `Adote mais ${
            metaProxima.faixa_adocoes_min - novasAdocoes
          } cartinha(s) para atingir o nível ${
            metaProxima.nivel_gamificacao
          } (${metaProxima.titulo_conquista})!`
        : "Você atingiu o nível máximo! 🌟",
    };

    // 4️⃣ Atualiza ou cria registro
    const campos = {
      id_usuario: [idUsuario],
      pontos_coracao: novosPontos,
      total_cartinhas_adotadas: novasAdocoes,
      nivel_atual: nivelAtual.nivel_gamificacao,
      titulo_conquista: nivelAtual.titulo_conquista,
      ultima_atualizacao: new Date().toISOString(),
    };

    if (idRegistro) {
      await base("gamificacao").update([{ id: idRegistro, fields: campos }]);
      console.log(`✅ Gamificação atualizada para ${idUsuario}`);
    } else {
      await base("gamificacao").create([{ fields: campos }]);
      console.log(`✅ Novo registro de gamificação criado (${idUsuario})`);
    }
  } catch (err) {
    console.error("⚠️ Erro na gamificação:", err.message);
  }

  return gamiData;
}

// ============================================================
// 🧩 Handler Principal
// ============================================================
export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  const id_adocao = req.query.id_adocao || req.body?.id_adocao;
  if (!id_adocao)
    return res.status(400).json({ sucesso: false, mensagem: "ID da adoção ausente." });

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const registro = await base("adocoes").find(id_adocao);
    const f = registro.fields;

    // 1️⃣ Atualiza status da adoção
    await base("adocoes").update([
      { id: id_adocao, fields: { status_adocao: "confirmada" } },
    ]);
    console.log(`✅ Adoção ${id_adocao} confirmada.`);

    // 2️⃣ Extrai IDs e dados
    const idUsuario = Array.isArray(f.nome_usuario) ? f.nome_usuario[0] : null;
    const emailDoador = f["email_usuario (from nome_usuario)"]?.[0] || "";
    const nomeDoador = f["nome_usuario (from nome_usuario)"]?.[0] || "";
    const childName = f["nome_crianca (from nome_crianca)"]?.[0] || "";
    const childGift = f["sonho (from nome_crianca)"]?.[0] || "";

    // 3️⃣ Busca ponto de coleta
    let pontoColeta = { nome: "", endereco: "", telefone: "", mapa_url: "" };
    const relPonto = Array.isArray(f.pontos_coleta) ? f.pontos_coleta[0] : null;

    if (relPonto) {
      try {
        const ponto = await base("pontos_coleta").find(relPonto);
        pontoColeta = {
          nome: ponto.get("nome_ponto") || "",
          endereco: ponto.get("endereco") || "",
          telefone: ponto.get("telefone") || "",
          mapa_url: `https://maps.google.com/maps?q=${encodeURIComponent(
            ponto.get("endereco") || ""
          )}`,
        };
      } catch (errPonto) {
        console.warn("⚠️ Falha ao buscar ponto de coleta:", errPonto);
      }
    }

    // 4️⃣ Atualiza gamificação
    let gamificacaoData = {};
    if (idUsuario) gamificacaoData = await atualizarGamificacao(base, idUsuario);

    // 5️⃣ Envia e-mail de confirmação
    if (emailDoador) {
      await enviarEmailDoador({
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: childName,
        sonho: childGift,
        ponto_coleta: pontoColeta,
        ...gamificacaoData,
      });
    } else {
      console.warn("⚠️ Nenhum e-mail de doador encontrado.");
    }

    // 6️⃣ Página de retorno (modo GET)
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Adoção Confirmada 💙</title>
            <style>
              body { font-family:'Poppins',sans-serif; background:#f0f7ff; text-align:center; padding:50px; color:#123456; }
              .card { background:#fff; border-radius:16px; display:inline-block; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,.08); }
              h1 { color:#1f6fe5; margin-bottom:10px; }
              p { font-size:16px; }
              a { background:#1f6fe5; color:#fff; text-decoration:none; padding:10px 18px; border-radius:24px; font-weight:600; display:inline-block; margin-top:20px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>💙 Adoção Confirmada com Sucesso!</h1>
              <p>O doador foi notificado e a gamificação atualizada.</p>
              <a href="${process.env.APP_BASE_URL || "https://carinamendesdev.github.io/varaldossonhossp/pages/admin.html"}">Voltar ao Painel</a>
            </div>
          </body>
        </html>
      `);
    }

    return res
      .status(200)
      .json({ sucesso: true, mensagem: "Adoção confirmada e e-mail enviado." });
  } catch (error) {
    console.error("🔥 Erro /api/confirmar:", error);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao confirmar adoção." });
  }
}
