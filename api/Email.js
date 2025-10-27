// ============================================================
// 💌 VARAL DOS SONHOS — /api/email.js
// ------------------------------------------------------------
// Envia mensagens genéricas via EmailJS (contato, confirmação, etc).
// ============================================================

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
  }

  try {
    const { nome, email, assunto, mensagem } = req.body || {};

    if (!nome || !email || !mensagem) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios: nome, email e mensagem.",
      });
    }

    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        from_name: nome,
        from_email: email,
        subject: assunto || "Contato pelo site Varal dos Sonhos",
        message: mensagem,
      },
    };

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Falha no envio: ${response.status}`);
    }

    res.status(200).json({ sucesso: true, mensagem: "E-mail enviado com sucesso! 💌" });
  } catch (e) {
    console.error("Erro /api/email:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao enviar e-mail.",
      detalhe: e.message,
    });
  }
}
