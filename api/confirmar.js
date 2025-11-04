// ============================================================
// 💌 VARAL DOS SONHOS — /api/confirmar.js (versão revisada TCC)
// ------------------------------------------------------------
// • Atualiza adoção -> confirmada
// • Envia e-mail de confirmação ao doador
// • Atualiza gamificação e retorna página de sucesso
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Utilitário para envio do e-mail ao doador
async function enviarEmailDoador(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_DOADOR,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_name: params.nome_doador || "",
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
      gami_next_goal: params.gami_next_goal || "Adote mais uma cartinha para subir de nível!",
    },
  };

  console.log("📦 Enviando payload EmailJS:", JSON.stringify(payload, null, 2));

  await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  const id_adocao = req.query.id_adocao || req.body?.id_adocao;
  if (!id_adocao) return res.status(400).json({ sucesso: false, mensagem: "ID da adoção ausente." });

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const registro = await base("adocoes").find(id_adocao);
    const f = registro.fields;

    // Atualiza status da adoção → confirmada
    await base("adocoes").update([{ id: id_adocao, fields: { status_adocao: "confirmada" } }]);
    console.log(`✅ Adoção ${id_adocao} confirmada.`);

    // Busca dados via lookups
    const emailDoador = f["email_usuario (from nome_usuario)"] || "";
    const nomeDoador = f["nome_usuario (from nome_usuario)"] || "";
    const childName = f["nome_crianca (from nome_crianca)"] || "";
    const childGift = f["sonho (from nome_crianca)"] || "";

    // Monta dados do ponto de coleta (opcional)
    let pontoColeta = { nome: "", endereco: "", telefone: "", mapa_url: "" };
    const relPonto = Array.isArray(f.pontos_coleta) ? f.pontos_coleta[0] : null;
    if (relPonto) {
      const ponto = await base("pontos_coleta").find(relPonto);
      pontoColeta = {
        nome: ponto.get("nome_ponto") || "",
        endereco: ponto.get("endereco") || "",
        telefone: ponto.get("telefone") || "",
        mapa_url: `https://maps.google.com/?q=${encodeURIComponent(ponto.get("endereco") || "")}`,
      };
    }

    // Envia e-mail ao doador
    await enviarEmailDoador({
      nome_doador: nomeDoador,
      email_doador: emailDoador,
      nome_crianca: childName,
      sonho: childGift,
      ponto_coleta: pontoColeta,
    });
    console.log(`📨 E-mail enviado ao doador ${emailDoador}`);

    // Retorna resposta visual se for GET
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Adoção Confirmada 💙</title>
            <style>
              body { font-family: 'Poppins', sans-serif; background:#f0f7ff; text-align:center; padding:50px; color:#123456; }
              .card { background:#fff; border-radius:16px; display:inline-block; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,.08); }
              h1 { color:#1f6fe5; margin-bottom:10px; }
              p { font-size:16px; }
              a { background:#1f6fe5; color:#fff; text-decoration:none; padding:10px 18px; border-radius:24px; font-weight:600; display:inline-block; margin-top:20px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>💙 Adoção Confirmada com Sucesso!</h1>
              <p>O doador foi notificado por e-mail e a pontuação será atualizada.</p>
              <a href="${process.env.APP_BASE_URL || ""}/pages/admin.html">Voltar ao Painel</a>
            </div>
          </body>
        </html>
      `);
    }

    return res.status(200).json({ sucesso: true, mensagem: "Adoção confirmada e e-mail enviado." });

  } catch (error) {
    console.error("🔥 Erro /api/confirmar:", error);
    return res.status(500).json({ sucesso: false, mensagem: "Erro ao confirmar adoção." });
  }
}
