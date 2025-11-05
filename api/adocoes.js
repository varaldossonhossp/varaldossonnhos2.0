// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (final, tabelas corretas)
// ------------------------------------------------------------
// • Cria registro em "adocoes"
// • Atualiza "cartinha" -> status "adotada"
// • Busca dados reais em: usuario, cartinha, pontos_coleta
// • Envia e-mail ao ADMIN (EmailJS com accessToken)
// ============================================================

import Airtable from "airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não suportado." });
  }

  try {
    // 🔑 Airtable
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
      status_adocao: "aguardando confirmacao",
      nome_crianca: [nome_crianca_id],
      nome_usuario: [nome_usuario_id],
    };
    if (data_evento_id) fieldsToCreate.data_evento = [data_evento_id];
    if (pontos_coleta_id) fieldsToCreate.pontos_coleta = [pontos_coleta_id];

    const novaAdocao = await base("adocoes").create([{ fields: fieldsToCreate }]);
    const idAdocao = novaAdocao[0].id;
    console.log(`✅ Adoção criada: ${idAdocao}`);

    // ============================================================
    // 2️⃣ Atualiza status da cartinha -> “adotada”
    //    (mantém o ID da opção já usado na sua base)
    // ============================================================
    try {
      await base("cartinha").update([
        { id: nome_crianca_id, fields: { status: "seld9JVzSUP4DShWu" } },
      ]);
      console.log(`✅ Cartinha ${nome_crianca_id} marcada como adotada.`);
    } catch (errCart) {
      console.warn("⚠️ Falha ao atualizar status da cartinha:", errCart);
    }

    // ============================================================
    // 3️⃣ Busca dados reais para o e-mail do ADMIN
    //    Tabelas corretas: usuario, cartinha, pontos_coleta
    // ============================================================
    let usuario = { fields: {} };
    let cartinha = { fields: {} };
    let ponto = { fields: {} };

    try {
      const [u, c, p] = await Promise.all([
        base("usuario").find(nome_usuario_id),
        base("cartinha").find(nome_crianca_id),
        base("pontos_coleta").find(pontos_coleta_id),
      ]);
      usuario = u;
      cartinha = c;
      ponto = p;
      console.log("📦 Dados (usuario/cartinha/pontos_coleta) obtidos com sucesso.");
    } catch (e) {
      console.warn("⚠️ Falha ao buscar dados detalhados:", e);
    }

    // Campos (com fallback seguro)
    const u = usuario.fields || {};
    const c = cartinha.fields || {};
    const p = ponto.fields || {};

    const donor_name  = u.nome_usuario  || "Novo Doador";
    const donor_email = u.email_usuario || "—";
    const donor_phone = u.telefone      || "—";

    const child_name  = c.nome_crianca  || `Cartinha ${nome_crianca_id}`;
    const child_gift  = c.sonho         || "—";

    const pickup_name    = p.nome_ponto || "—";
    const pickup_address = p.endereco   || "—";
    const pickup_phone   = p.telefone   || "—";

    // ============================================================
    // 4️⃣ Envia e-mail ao ADMIN (EmailJS, private key no accessToken)
    // ============================================================
    try {
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = process.env.EMAILJS_TEMPLATE_ID || "template_c7kwpbk";
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;     // Public Key
      const privateKey = process.env.EMAILJS_PRIVATE_KEY;   // Private Key / Access Token

      if (!serviceId || !templateId || !publicKey || !privateKey) {
        throw new Error("Chaves EmailJS ausentes ou incorretas (SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY, PRIVATE_KEY).");
      }

      const emailBody = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey, // ✅ modo privado/servidor
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
        },
      };

      console.log("📨 Enviando payload ao EmailJS:", JSON.stringify(emailBody, null, 2));

      const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailBody),
      });

      const respText = await emailResp.text();
      console.log("📧 Resposta EmailJS:", emailResp.status, respText);
      if (!emailResp.ok) throw new Error(respText);

      console.log("✅ E-mail enviado ao administrador com sucesso!");
    } catch (errEmail) {
      console.warn("⚠️ Falha ao enviar e-mail (ADMIN):", errEmail.message);
    }

    // ============================================================
    // 5️⃣ Resposta
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
      error: error.message,
    });
  }
}
