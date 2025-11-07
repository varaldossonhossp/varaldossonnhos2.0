// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão final corrigida TCC)
// ------------------------------------------------------------
// • Cria registro em "adocoes"
// • Atualiza "cartinha" -> status "adotada"
// • Busca dados de usuário, cartinha e ponto de coleta
// • Envia e-mail ao ADMIN com link de confirmação
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não suportado." });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const { nome_crianca_id, nome_usuario_id, pontos_coleta_id, data_evento_id } = req.body || {};

    if (!nome_crianca_id || !nome_usuario_id || !pontos_coleta_id) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes (nome_crianca_id, nome_usuario_id, pontos_coleta_id).",
      });
    }

    // ============================================================
    // 1️⃣ Cria registro na tabela “adocoes”
    // ============================================================
    const fieldsToCreate = {
      data_adocao: new Date().toISOString().split("T")[0],
      status_adocao: "aguardando confirmacao", // ✅ Single select - valor literal
      nome_crianca: [nome_crianca_id],
      nome_usuario: [nome_usuario_id],
    };

    if (data_evento_id) fieldsToCreate.data_evento = [data_evento_id];
    if (pontos_coleta_id) fieldsToCreate.pontos_coleta = [pontos_coleta_id];

    const novaAdocao = await base("adocoes").create([{ fields: fieldsToCreate }]);
    const idAdocao = novaAdocao[0].id;
    console.log(`✅ Adoção criada com sucesso: ${idAdocao}`);

    // ============================================================
    // 2️⃣ Atualiza status da cartinha → “adotada”
    // ============================================================
    try {
      await base("cartinha").update([
        { id: nome_crianca_id, fields: { status: "adotada" } }, // ✅ valor literal
      ]);
      console.log(`✅ Cartinha ${nome_crianca_id} marcada como adotada.`);
    } catch (errCart) {
      console.warn("⚠️ Falha ao atualizar status da cartinha:", errCart);
    }

    // ============================================================
    // 3️⃣ Busca dados detalhados (para envio de e-mail)
    // ============================================================
    let usuario = { fields: {} }, cartinha = { fields: {} }, ponto = { fields: {} };
    try {
      const [u, c, p] = await Promise.all([
        base("usuario").find(nome_usuario_id),
        base("cartinha").find(nome_crianca_id),
        base("pontos_coleta").find(pontos_coleta_id),
      ]);
      usuario = u; cartinha = c; ponto = p;
    } catch (e) {
      console.warn("⚠️ Falha ao buscar dados detalhados:", e);
    }

    const u = usuario.fields || {};
    const c = cartinha.fields || {};
    const p = ponto.fields || {};

    const donor_name = u.nome_usuario || "Novo Doador";
    const donor_email = u.email_usuario || "—";
    const donor_phone = u.telefone || "—";
    const child_name = c.nome_crianca || `Cartinha ${nome_crianca_id}`;
    const child_gift = c.sonho || "—";
    const pickup_name = p.nome_ponto || "—";
    const pickup_address = p.endereco || "—";
    const pickup_phone = p.telefone || "—";

    // ============================================================
    // 4️⃣ Envia e-mail ao ADMIN com link de confirmação
    // ============================================================
    try {
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = process.env.EMAILJS_TEMPLATE_ADMIN_ID;
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;
      const privateKey = process.env.EMAILJS_PRIVATE_KEY;
      const appBase = process.env.APP_BASE_URL || req.headers.origin || "https://varaldossonhos2-0.vercel.app";

      if (!serviceId || !templateId || !publicKey || !privateKey) {
        throw new Error("Variáveis EmailJS ausentes ou incorretas.");
      }

      const emailBody = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          donor_name,
          donor_email,
          donor_phone,
          child_name,
          child_gift,
          pickup_name,
          pickup_address,
          pickup_phone,
          order_id: idAdocao,
          confirmation_link: `${appBase}/api/confirmar?id_adocao=${idAdocao}`,
          to_email: process.env.EMAILJS_ADMIN_EMAIL,
        },
      };

      console.log("📨 Enviando payload ao EmailJS:", JSON.stringify(emailBody, null, 2));

      const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailBody),
      });

      if (!emailResp.ok) {
        console.error("❌ Falha ao enviar e-mail:", await emailResp.text());
        throw new Error("Erro no envio via EmailJS");
      }

      console.log("✅ E-mail enviado ao administrador com sucesso!");
    } catch (errEmail) {
      console.warn("⚠️ Falha ao enviar e-mail (ADMIN):", errEmail.message);
    }

    // ============================================================
    // 5️⃣ Retorno final
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Adoção criada e administrador notificado.",
      id_adocao: idAdocao,
    });
  } catch (error) {
    console.error("❌ ERRO INTERNO /api/adocoes:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar adoção.",
      detalhe: error.message,
    });
  }
}
