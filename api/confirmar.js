// ============================================================
// 💌 VARAL DOS SONHOS — /api/confirmar.js (Versão Final — TCC)
// ------------------------------------------------------------
// Objetivo: confirmar adoções pelo link enviado ao ADMIN via e-mail.
// Funções principais:
//   Recebe o ID da adoção (via URL ou corpo da requisição);
//   Atualiza o status da adoção → "confirmada";
//   Envia e-mail automático ao doador (confirmação e instruções);
//   Atualiza pontuação de gamificação.
// ------------------------------------------------------------
// Integrações:
//   - Airtable (dados)
//   - EmailJS (envio do e-mail ao doador)
//   - API /api/gamificacao (pontuação)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

const ok  = (res, data)          => res.status(200).json(data);
const err = (res, code, message) => res.status(code).json({ sucesso: false, mensagem: message });

async function enviarEmailDoador(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,                 // ✅ mantém variáveis
    template_id: process.env.EMAILJS_TEMPLATE_ID_DOADOR,        // ex: template_4yfc899
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_name: params.nome_doador || "",
      to_email: params.email_doador || "",                      // ✅ garanta template use {{to_email}} como destinatário
      child_name: params.nome_crianca || "",
      child_age: params.idade || "",
      child_gift: params.sonho || "",
      deadline: params.data_limite || "",
      order_id: params.id_adocao || "",
      pickup_name: params.ponto_coleta?.nome || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      pickup_map_url: params.ponto_coleta?.mapa_url || "",
      gami_level: params.gami_level || 1,
      gami_points: params.gami_points || 10,
      gami_badge_title: params.gami_badge_title || "💙 Iniciante Solidário",
      gami_next_goal: params.gami_next_goal || "Adote mais uma cartinha para subir de nível!",
    },
  };

  // 👇 Log de depuração (ver no painel Vercel → Function Logs)
  console.log("📦 Enviando payload EmailJS:", JSON.stringify(payload, null, 2));

  await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const metodo = req.method;
  if (metodo !== "GET" && metodo !== "POST") return err(res, 405, "Método não suportado.");

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES = "adocoes";
    const T_PONTOS  = process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta"; // ✅

    // 2️⃣ ID da adoção
    const id_adocao = req.query.id_adocao || req.body?.id_adocao;
    if (!id_adocao) return err(res, 400, "ID da adoção ausente.");

    // 3️⃣ Busca a adoção
    const registro = await base(T_ADOCOES).find(id_adocao);
    if (!registro) return err(res, 404, "Adoção não encontrada.");
    const f = registro.fields;

    // 4️⃣ Atualiza status → confirmada
    await base(T_ADOCOES).update([
      { id: id_adocao, fields: { status_adocao: "confirmada" } } // ✅ rótulo funciona
      // se preferir ID da opção: "sel2kgUXRs2bzQY7R"
    ]);

    // 5️⃣ Monta dados reais via lookups
    const emailDoador = f["email_usuario (from nome_usuario)"] || "";        // ✅
    const nomeDoador  = f["nome_usuario (from nome_usuario)"]  || "";        // ✅
    const childName   = f["nome_crianca (from nome_crianca)"]  || "";        // ✅
    const childGift   = f["sonho (from nome_crianca)"]          || "";        // ✅
    const deadline    = f["data_limite_recebimento (from data_evento)"] || ""; // se existir lookup

    // Ponto de coleta: buscar registro para pegar ENDEREÇO (lookup não existe)
    let pontoColeta = { nome: "", endereco: "", telefone: "", mapa_url: "" };
    const relPonto = Array.isArray(f.pontos_coleta) ? f.pontos_coleta[0] : null; // id do record
    if (relPonto) {
      try {
        const ponto = await base(T_PONTOS).find(relPonto);
        pontoColeta = {
          nome:     ponto.get("nome_ponto") || (f["nome_ponto (from pontos_coleta)"] || ""),
          endereco: ponto.get("endereco")   || "",
          telefone: ponto.get("telefone")   || (f["telefone (from pontos_coleta)"] || ""),
          mapa_url: `https://maps.google.com/?q=${encodeURIComponent(ponto.get("endereco") || "")}`,
        };
      } catch { /* segue sem endereço */ }
    }

    // Envia e-mail ao doador
    try {
      await enviarEmailDoador({
        id_adocao: id_adocao,
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: childName,
        sonho: childGift,
        ponto_coleta: pontoColeta,
        data_limite: deadline,
        gami_level: 1,
        gami_points: 10,
        gami_badge_title: "💙 Iniciante Solidário",
        gami_next_goal: "Adote mais uma cartinha para subir de nível!",
      });
      console.log("📨 E-mail de confirmação enviado ao doador:", emailDoador);
    } catch (e) {
      console.error("⚠️ Falha ao enviar e-mail ao doador:", e);
    }

    // Gamificação (mantido, mas ajustando campos)
    try {
      const totalConfirmadas = await base(T_ADOCOES).select({
        filterByFormula: `AND({email_usuario (from nome_usuario)}='${emailDoador}', {status_adocao}='confirmada')`
      }).all();

      const total = totalConfirmadas.length;
      const pontos_coracao = total * 10;

      let titulo_conquista = "💙 Iniciante Solidário";
      if (total >= 5) titulo_conquista = "👑 Lenda dos Sonhos";
      else if (total >= 4) titulo_conquista = "🌟 Guardião dos Sonhos";
      else if (total >= 3) titulo_conquista = "🏅 Mestre dos Sonhos";
      else if (total >= 2) titulo_conquista = "💛 Segundo Gesto de Amor";

      // id_usuario via lookup, se existir
      const idUsuarioLookup = f["id_usuario (from nome_usuario)"];
      await fetch(`${process.env.APP_BASE_URL}/api/gamificacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: idUsuarioLookup || "",
          pontos_coracao,
          total_cartinhas_adotadas: total,
          titulo_conquista,
        }),
      });
    } catch (gamiErr) {
      console.error("⚠️ Erro ao atualizar gamificação:", gamiErr);
    }

    // 7️⃣ Resposta (HTML para GET)
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`
        <html lang="pt-BR">
          <head>
            <title>Adoção Confirmada 💙</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Poppins', sans-serif; background: #f0f7ff; text-align: center; padding: 60px; color: #123456; }
              .card { background: #fff; border-radius: 16px; display:inline-block; padding: 40px; box-shadow:0 4px 10px rgba(0,0,0,.08); }
              h1 { color:#1f6fe5; margin-bottom:10px; }
              p { font-size:16px; }
              a { background:#1f6fe5; color:#fff; text-decoration:none; padding:10px 18px; border-radius:24px; font-weight:600; display:inline-block; margin-top:20px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>💙 Adoção Confirmada com Sucesso!</h1>
              <p>O doador foi notificado por e-mail e a pontuação foi atualizada.</p>
              <a href="${process.env.APP_BASE_URL || ""}/pages/admin.html">Voltar ao Painel</a>
            </div>
          </body>
        </html>
      `);
    }

    return ok(res, { sucesso: true, mensagem: "Adoção confirmada e e-mail enviado." });

  } catch (e) {
    console.error("🔥 Erro /api/confirmar:", e);
    return err(res, 500, "Erro ao confirmar adoção.");
  }
}
