// ============================================================
// ✅ VARAL DOS SONHOS — /api/confirmar.js
// ------------------------------------------------------------
// 1) Admin clica no botão do e-mail -> GET /api/confirmar?id_adocao=recXXXXX
// 2) Atualiza "status_adocao = confirmada" na tabela "adocoes" "confirmada"
// 3) Envia e-mail ao DOADOR com instruções para compra do presente
// 4) Exibe HTML de sucesso/erro
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// -------- resposta HTML curta --------
function page(title, body, ok = true) {
  return `
<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f7fbff;margin:0;padding:40px;color:#123;}
  .card{max-width:720px;margin:auto;background:#fff;border:1px solid #e5eef9;border-radius:14px;padding:28px;box-shadow:0 10px 28px rgba(9,30,66,.08)}
  h1{margin:0 0 8px;font-size:1.6rem;color:${ok ? "#0a8754" : "#b00020"}}
  p{margin:.5rem 0 0;line-height:1.55}
  a.btn{display:inline-block;margin-top:18px;padding:10px 16px;border-radius:999px;text-decoration:none;border:2px solid #2f80ed;color:#2f80ed}
  a.btn:hover{background:#2f80ed;color:#fff}
</style>
</head><body><div class="card">
  <h1>${title}</h1>
  <p>${body}</p>
  <a class="btn" href="${process.env.APP_BASE_URL || "/"}">Voltar ao site</a>
</div></body></html>`;
}

// -------- e-mail ao doador via EmailJS --------
async function enviarEmailDoador(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_USER, // template_4yfc839
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_name:       params.nome_doador || "",
      to_email:      params.email_doador || "",
      order_id:      params.id_adocao || "",
      child_name:    params.nome_crianca || "",
      child_gift:    params.sonho || "",
      deadline:      params.data_limite || "",
      pickup_name:   params.ponto_coleta?.nome     || params.ponto_coleta || "",
      pickup_address:params.ponto_coleta?.endereco || params.ponto_coleta || "",
      pickup_phone:  params.ponto_coleta?.telefone || "",
      score_points:  params.pontos || "10",
      score_level:   params.nivel  || "1",
    },
  };

  try {
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) console.warn("EmailJS (user) falhou:", r.status);
  } catch (e) {
    console.warn("EmailJS (user) erro:", e.message);
  }
}

export default async function handler(req, res) {
  try {
    const id_adocao = (req.query?.id_adocao || "").trim();
    if (!id_adocao) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(400).send(page("Link inválido", "O identificador da adoção não foi informado.", false));
    }

    // ------ Airtable ------
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES = "adocoes";

    // Recupera a adoção
    const rec = await base(T_ADOCOES).find(id_adocao);
    const fields = rec.fields || {};

    // Se já confirmada, apenas mostra a mensagem
    if ((fields.status_adocao || "").toLowerCase() === "confirmada") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(page("Adoção já confirmada",
        "Esta adoção já foi confirmada anteriormente e o doador já deve ter sido notificado."));
    }

    // Atualiza para confirmada
    await base(T_ADOCOES).update([{ id: id_adocao, fields: { status_adocao: "confirmada" } }]);

    // Dispara e-mail ao doador com gamificação básica
    await enviarEmailDoador({
      id_adocao,
      nome_doador:   fields.nome_doador,
      email_doador:  fields.email_doador,
      nome_crianca:  fields.nome_crianca,
      sonho:         fields.sonho,
      ponto_coleta:  { nome: fields.ponto_coleta || "" }, // se desejar guardar endereço/telefone, inclua na adoção
      data_limite:   fields.data_limite_recebimento || "",
      pontos:        "10",
      nivel:         "1",
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res
      .status(200)
      .send(page("Adoção confirmada com sucesso",
        "O status foi atualizado para <b>confirmada</b> e o e-mail foi enviado ao doador com as instruções para compra do presente."));
  } catch (e) {
    console.error("Erro /api/confirmar:", e);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res
      .status(500)
      .send(page("Erro ao confirmar", "Ocorreu um erro ao processar a confirmação. Tente novamente.", false));
  }
}
