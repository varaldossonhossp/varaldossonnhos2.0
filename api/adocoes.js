// ============================================================
// 💌 VARAL DOS SONHOS — /api/adocoes.js
// ------------------------------------------------------------
// 1) Cria o registro na tabela "adocoes"
// 2) Atualiza a cartinha para status = "adotada"
// 3) Envia e-mail ao ADMIN com botão "Confirmar Adoção"
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// -------- utilitários HTTP --------
const ok  = (res, data)          => res.status(200).json(data);
const err = (res, code, message) => res.status(code).json({ sucesso: false, mensagem: message });

// -------- e-mail via EmailJS --------
async function enviarEmailAdmin(params) {
  // Mapeamento mínimo para o template do ADMIN
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_ADMIN, // template_c7kwpbk
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      // para quem vai
      email: process.env.EMAIL_ADMIN,

      // dados para o corpo do e-mail (placeholders do seu template)
      donor_name: params.nome_doador || "",
      donor_email: params.email_doador || "",
      donor_phone: params.telefone_doador || "",
      child_name: params.nome_crianca || "",
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || params.ponto_coleta || "",
      pickup_address: params.ponto_coleta?.endereco || params.ponto_coleta || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      order_id: params.id_adocao || "",

      // URL do botão "Confirmar Adoção"
      confirm_url: `${process.env.APP_BASE_URL || ""}/api/confirmar?id_adocao=${encodeURIComponent(params.id_adocao || "")}`,
    },
  };

  try {
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) console.warn("EmailJS (admin) falhou:", r.status);
  } catch (e) {
    console.warn("EmailJS (admin) erro:", e.message);
  }
}

export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return err(res, 405, "Método não suportado.");
  }

  try {
    // ------ Airtable base ------
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES   = "adocoes";
    const T_CARTINHAS = "cartinhas";

    // ------ payload do front (carrinho.js) ------
    const {
      id_cartinha,
      id_usuario,
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta,     // pode ser string (nome) ou objeto {nome,endereco,telefone}
      nome_crianca,
      sonho,
    } = req.body || {};

    if (!id_cartinha || !id_usuario) {
      return err(res, 400, "Faltam dados obrigatórios (id_cartinha e id_usuario).");
    }

    // ------ cria adoção ------
    const novo = {
      data_adocao: new Date().toISOString(),
      id_cartinha,
      id_usuario,
      nome_doador:    nome_doador    || "",
      email_doador:   email_doador   || "",
      telefone_doador:telefone_doador|| "",
      ponto_coleta:   typeof ponto_coleta === "string" ? ponto_coleta : (ponto_coleta?.nome || ""),
      nome_crianca:   nome_crianca   || "",
      sonho:          sonho          || "",
      status_adocao:  "aguardando confirmacao",
    };

    const recs = await base(T_ADOCOES).create([{ fields: novo }]);
    const id_adocao = recs[0].id;

    // ------ marca cartinha como adotada ------
    await base(T_CARTINHAS).update([{ id: id_cartinha, fields: { status: "adotada" } }]);

    // ------ dispara e-mail ao ADMIN (não bloqueia a resposta) ------
    enviarEmailAdmin({
      id_adocao,
      nome_doador,
      email_doador,
      telefone_doador,
      nome_crianca,
      sonho,
      ponto_coleta,
    });

    return ok(res, { sucesso: true, id_adocao });
  } catch (e) {
    console.error("Erro /api/adocoes:", e);
    return err(res, 500, "Erro interno ao criar adoção.");
  }
}
