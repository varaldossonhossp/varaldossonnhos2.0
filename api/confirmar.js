// ============================================================
// 💌 VARAL DOS SONHOS — /api/confirmar.js (Versão Final — TCC)
// ------------------------------------------------------------
// Objetivo: confirmar adoções pelo link enviado ao ADMIN via e-mail.
// Funções principais:
//   1️⃣ Recebe o ID da adoção (via URL ou corpo da requisição);
//   2️⃣ Atualiza o status da adoção → "confirmada";
//   3️⃣ Envia e-mail automático ao doador (confirmação e instruções);
//   4️⃣ Atualiza pontuação de gamificação.
// ------------------------------------------------------------
// Integrações:
//   - Airtable (dados)
//   - EmailJS (envio do e-mail ao doador)
//   - API /api/gamificacao (pontuação)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ============================================================
// 🔧 Utilitários HTTP
// ============================================================
const ok  = (res, data)          => res.status(200).json(data);
const err = (res, code, message) => res.status(code).json({ sucesso: false, mensagem: message });

// ============================================================
// 💌 Envio de e-mail ao Doador
// ------------------------------------------------------------
// Template: "Order Confirmation (Doador)"
// Mostra os detalhes da cartinha, ponto de coleta e bloco
// de gamificação com o nível, pontos e próxima meta.
// ============================================================
async function enviarEmailDoador(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_DOADOR, // Ex: "template_order_confirm"
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_name: params.nome_doador,
      to_email: params.email_doador,
      child_name: params.nome_crianca,
      child_age: params.idade || "",
      child_gift: params.sonho,
      deadline: params.data_limite || "",
      order_id: params.id_adocao,
      pickup_name: params.ponto_coleta?.nome || params.ponto_coleta || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      pickup_map_url: params.ponto_coleta?.mapa_url || "",

      // Bloco de gamificação (opcional)
      gami_level: params.gami_level || 1,
      gami_points: params.gami_points || 10,
      gami_badge_title: params.gami_badge_title || "💙 Iniciante Solidário",
      gami_next_goal: params.gami_next_goal || "Adote mais uma cartinha para subir de nível!",
    },
  };

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("📧 E-mail de confirmação enviado ao doador:", params.email_doador);
  } catch (e) {
    console.error("⚠️ Erro ao enviar e-mail ao doador:", e.message);
  }
}

// ============================================================
// 🧩 Handler Principal
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Permite confirmação via GET (pelo link do e-mail)
  const metodo = req.method;
  if (metodo !== "GET" && metodo !== "POST") return err(res, 405, "Método não suportado.");

  try {
    // ============================================================
    // 1️⃣ Conexão com Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES = "adocoes";

    // ============================================================
    // 2️⃣ Captura o ID da adoção
    // ============================================================
    const id_adocao = req.query.id_adocao || req.body?.id_adocao;
    if (!id_adocao) return err(res, 400, "ID da adoção ausente.");

    // ============================================================
    // 3️⃣ Busca o registro correspondente
    // ============================================================
    const registro = await base(T_ADOCOES).find(id_adocao);
    if (!registro) return err(res, 404, "Adoção não encontrada.");

    const dados = registro.fields;

    // ============================================================
    // 4️⃣ Atualiza status → confirmada
    // ============================================================
    await base(T_ADOCOES).update([{ id: id_adocao, fields: { status_adocao: "confirmada" } }]);
    console.log(`✅ Adoção ${id_adocao} confirmada pelo ADMIN.`);

    // ============================================================
    // 5️⃣ Envia e-mail de confirmação ao doador
    // ============================================================
    enviarEmailDoador({
      id_adocao,
      nome_doador: dados.nome_doador,
      email_doador: dados.email_doador,
      nome_crianca: dados.nome_crianca,
      sonho: dados.sonho,
      ponto_coleta: dados.ponto_coleta,
      data_limite: dados.data_limite_recebimento || "",
    });

    // ============================================================
    // 6️⃣ Atualiza Gamificação do Doador
    // ------------------------------------------------------------
    // Conta quantas adoções confirmadas o doador possui e
    // ajusta automaticamente o nível e a pontuação.
    // ============================================================
    try {
      const adocoesConfirmadas = await base(T_ADOCOES)
        .select({
          filterByFormula: `AND({email_doador}='${dados.email_doador}', {status_adocao}='confirmada')`,
        })
        .all();

      const total = adocoesConfirmadas.length;
      const pontos_coracao = total * 10;

      let titulo_conquista = "💙 Iniciante Solidário";
      if (total >= 5) titulo_conquista = "👑 Lenda dos Sonhos";
      else if (total >= 4) titulo_conquista = "🌟 Guardião dos Sonhos";
      else if (total >= 3) titulo_conquista = "🏅 Mestre dos Sonhos";
      else if (total >= 2) titulo_conquista = "💛 Segundo Gesto de Amor";

      await fetch(`${process.env.APP_BASE_URL}/api/gamificacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: dados.id_usuario,
          pontos_coracao,
          total_cartinhas_adotadas: total,
          titulo_conquista,
        }),
      });

      console.log("🏆 Gamificação atualizada após confirmação:", dados.email_doador);
    } catch (gamiErr) {
      console.error("⚠️ Erro ao atualizar gamificação:", gamiErr);
    }

    // ============================================================
    // 7️⃣ Resposta final ao navegador
    // ============================================================
    if (req.method === "GET") {
      // Exibe página simples de sucesso (para o admin ver no navegador)
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
              <p>O doador será notificado por e-mail e a pontuação foi atualizada.</p>
              <a href="${process.env.APP_BASE_URL || ""}/pages/admin.html">Voltar ao Painel</a>
            </div>
          </body>
        </html>
      `);
    }

    // Retorno padrão (JSON)
    return ok(res, { sucesso: true, mensagem: "Adoção confirmada e e-mail enviado." });

  } catch (e) {
    console.error("🔥 Erro /api/confirmar:", e);
    return err(res, 500, "Erro ao confirmar adoção.");
  }
}
