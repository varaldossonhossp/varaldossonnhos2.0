// ============================================================
// 💌 VARAL DOS SONHOS — /lib/enviarEmail.js
// ------------------------------------------------------------
// Função utilitária para enviar e-mails via EmailJS
// ============================================================

import emailjs from "@emailjs/nodejs"; // Pacote oficial do EmailJS

export default async function enviarEmail({ to_email, to_name, subject, message }) {
  try {
    const serviceID = process.env.EMAILJS_SERVICE_ID;
    const templateID = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    // Envia e-mail via API do EmailJS
    await emailjs.send(serviceID, templateID, {
      to_email,
      to_name,
      subject,
      message,
    }, { publicKey });

    console.log(`✅ E-mail enviado para ${to_name} (${to_email})`);
  } catch (erro) {
    console.error("❌ Falha ao enviar e-mail:", erro);
  }
}
