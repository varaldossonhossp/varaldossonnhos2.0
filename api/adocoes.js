// ============================================================
// 💌 VARAL DOS SONHOS — /api/adocoes.js (Versão Final — TCC)
// ------------------------------------------------------------
// Objetivo: Gerenciar o ciclo de uma nova adoção.
// Fluxo completo:
//   1️⃣ Cria o registro na tabela "adocoes"
//   2️⃣ Atualiza a cartinha para status = "adotada"
//   3️⃣ Envia e-mail ao ADMIN com botão "Confirmar Adoção"
//   4️⃣ Atualiza automaticamente a gamificação do doador
// ------------------------------------------------------------
// Integrações:
//   - Airtable (base de dados)
//   - EmailJS (envio de e-mails automáticos)
//   - API /api/gamificacao.js (para pontuação do doador)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ============================================================
// 🔧 Funções utilitárias HTTP
// ============================================================
const ok  = (res, data)          => res.status(200).json(data);
const err = (res, code, message) => res.status(code).json({ sucesso: false, mensagem: message });

// ============================================================
// 💌 Envio de e-mail ao ADMIN (confirmação manual de adoção)
// ------------------------------------------------------------
// Template: Admin Confirmation Request (template_c7kwpbk)
// Envia um e-mail com botão “Confirmar Adoção” contendo
// os dados do doador, da criança e do ponto de coleta.
// ============================================================
async function enviarEmailAdmin(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_ADMIN, // Ex: "template_c7kwpbk"
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      // 📧 E-mail do admin
      email: process.env.EMAIL_ADMIN,

      // Dados que aparecem no corpo do e-mail
      donor_name: params.nome_doador || "",
      donor_email: params.email_doador || "",
      donor_phone: params.telefone_doador || "",
      child_name: params.nome_crianca || "",
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || params.ponto_coleta || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      order_id: params.id_adocao || "",

      // 🔗 Link com ID da adoção (para o botão Confirmar Adoção)
      confirm_url: `${process.env.APP_BASE_URL || ""}/api/confirmar?id_adocao=${encodeURIComponent(params.id_adocao || "")}`,
    },
  };

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("📧 E-mail enviado ao ADMIN solicitando confirmação da adoção.");
  } catch (e) {
    console.warn("⚠️ Falha no envio do e-mail ao ADMIN:", e.message);
  }
}

// ============================================================
// 🧩 Handler Principal da API
// ============================================================
export default async function handler(req, res) {
  // Configuração CORS (permite acesso do front)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Bloqueia métodos não permitidos
  if (req.method !== "POST") return err(res, 405, "Método não suportado.");

  try {
    // ============================================================
    // 1️⃣ Conexão com o Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES   = "adocoes";
    const T_CARTINHAS = "cartinhas";

    // ============================================================
    // 2️⃣ Dados recebidos do front-end (carrinho.js)
    // ============================================================
    const {
      id_cartinha,
      id_usuario,
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta,
      nome_crianca,
      sonho,
    } = req.body || {};

    // Validação básica
    if (!id_cartinha || !id_usuario) {
      return err(res, 400, "Faltam dados obrigatórios (id_cartinha e id_usuario).");
    }

    // ============================================================
    // 3️⃣ Cria o registro de adoção (status inicial: aguardando)
    // ============================================================
    const novo = {
      data_adocao: new Date().toISOString(),
      id_cartinha,
      id_usuario,
      nome_doador: nome_doador || "",
      email_doador: email_doador || "",
      telefone_doador: telefone_doador || "",
      ponto_coleta: typeof ponto_coleta === "string" ? ponto_coleta : (ponto_coleta?.nome || ""),
      nome_crianca: nome_crianca || "",
      sonho: sonho || "",
      status_adocao: "aguardando confirmacao",
    };

    const recs = await base(T_ADOCOES).create([{ fields: novo }]);
    const id_adocao = recs[0].id;
    console.log("📝 Nova adoção registrada:", id_adocao);

    // ============================================================
    // 4️⃣ Atualiza a cartinha → status = "adotada"
    // ============================================================
    await base(T_CARTINHAS).update([{ id: id_cartinha, fields: { status: "adotada" } }]);
    console.log("🎀 Cartinha marcada como 'adotada' no Airtable.");

    // ============================================================
    // 5️⃣ Envia e-mail ao ADMIN solicitando confirmação
    // ============================================================
    enviarEmailAdmin({
      id_adocao,
      nome_doador,
      email_doador,
      telefone_doador,
      nome_crianca,
      sonho,
      ponto_coleta,
    });

    // ============================================================
    // 6️⃣ Atualiza automaticamente a Gamificação do Doador
    // ------------------------------------------------------------
    // Ao criar uma nova adoção, recalcula o total de adoções
    // confirmadas do doador e ajusta sua pontuação e título.
    // ============================================================
    try {
      // Conta quantas adoções confirmadas o doador já tem
      const adocoesConfirmadas = await base(T_ADOCOES)
        .select({
          filterByFormula: `AND({email_doador}='${email_doador}', {status_adocao}='confirmada')`,
        })
        .all();

      const total = adocoesConfirmadas.length;
      const pontos_coracao = total * 10;

      // Definição de título conforme número de adoções
      let titulo_conquista = "💙 Iniciante Solidário";
      if (total >= 5) titulo_conquista = "👑 Lenda dos Sonhos";
      else if (total >= 4) titulo_conquista = "🌟 Guardião dos Sonhos";
      else if (total >= 3) titulo_conquista = "🏅 Mestre dos Sonhos";
      else if (total >= 2) titulo_conquista = "💛 Segundo Gesto de Amor";

      // Envia dados para a API de gamificação
      await fetch(`${process.env.APP_BASE_URL}/api/gamificacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario,
          pontos_coracao,
          total_cartinhas_adotadas: total,
          titulo_conquista,
        }),
      });

      console.log("🏆 Gamificação atualizada para:", email_doador);
    } catch (gamiErr) {
      console.error("⚠️ Erro ao atualizar gamificação:", gamiErr);
    }

    // ============================================================
    // 7️⃣ Retorna sucesso ao front
    // ============================================================
    return ok(res, { sucesso: true, id_adocao });

  } catch (e) {
    console.error("🔥 Erro interno /api/adocoes:", e);
    return err(res, 500, "Erro interno ao criar adoção.");
  }
}
