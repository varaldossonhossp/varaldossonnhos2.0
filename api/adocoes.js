// ============================================================
// 💌 VARAL DOS SONHOS — /api/adocoes.js (Versão Final Revisada)
// ------------------------------------------------------------
// Objetivo: Registrar adoções no Airtable, atualizar cartinha,
// enviar e-mail ao admin e atualizar gamificação do doador.
// ------------------------------------------------------------
// Fluxo completo:
//   1️⃣ Cria o registro na tabela "adocoes"
//   2️⃣ Atualiza a cartinha para status = "adotada"
//   3️⃣ Envia e-mail ao ADMIN
//   4️⃣ Atualiza gamificação do doador
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

const ok  = (res, data)          => res.status(200).json(data);
const err = (res, code, message) => res.status(code).json({ sucesso: false, mensagem: message });

// ============================================================
// 💌 Envio de e-mail ao ADMIN (igual à versão funcional)
// ============================================================
async function enviarEmailAdmin(params) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID_ADMIN,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      email: process.env.EMAIL_ADMIN,
      donor_name: params.nome_doador || "",
      donor_email: params.email_doador || "",
      donor_phone: params.telefone_doador || "",
      child_name: params.nome_crianca || "",
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || params.ponto_coleta || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      order_id: params.id_adocao || "",
      confirm_url: `${process.env.APP_BASE_URL || ""}/api/confirmar?id_adocao=${encodeURIComponent(params.id_adocao || "")}`,
    },
  };

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("📧 E-mail enviado ao ADMIN.");
  } catch (e) {
    console.warn("⚠️ Falha no envio de e-mail ao ADMIN:", e.message);
  }
}

// ============================================================
// 🧩 Handler principal
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return err(res, 405, "Método não suportado.");

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const T_ADOCOES  = "adocoes";
    const T_CARTINHA = "cartinha";

    // ------------------------------------------------------------
    // 1️⃣ Captura dados do corpo da requisição
    // ------------------------------------------------------------
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

    if (!id_usuario || (!id_cartinha && !nome_crianca)) {
      console.error("❌ Dados ausentes no corpo:", req.body);
      return err(res, 400, "Faltam dados obrigatórios.");
    }

    // ------------------------------------------------------------
    // 2️⃣ Busca o registro da cartinha no Airtable
    // ------------------------------------------------------------
    let recordId = null;
    const filtro = id_cartinha
      ? `OR({id_cartinha}=${Number(id_cartinha)}, {id_cartinha}='${id_cartinha}')`
      : `{nome_crianca}='${nome_crianca}'`;

    console.log("🔍 Filtro de busca:", filtro);

    const encontrados = await base(T_CARTINHA)
      .select({ filterByFormula: filtro, maxRecords: 1 })
      .firstPage();

    if (encontrados.length > 0) {
      recordId = encontrados[0].id;
      console.log("📄 Cartinha encontrada:", recordId);
    } else {
      console.warn("⚠️ Nenhuma cartinha encontrada com filtro:", filtro);
    }

    // ------------------------------------------------------------
    // 3️⃣ Cria registro na tabela de adoções
    // ------------------------------------------------------------
    const novo = {
      data_adocao: new Date().toISOString(),
      id_cartinha: id_cartinha || "",
      id_usuario: id_usuario,
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

    // ------------------------------------------------------------
    // 4️⃣ Atualiza a cartinha para "adotada"
    // ------------------------------------------------------------
    if (recordId) {
      await base(T_CARTINHA).update([{ id: recordId, fields: { status: "adotada" } }]);
      console.log("🎀 Cartinha marcada como adotada:", recordId);
    } else {
      console.warn("⚠️ Cartinha não encontrada para atualização.");
    }

    // ------------------------------------------------------------
    // 5️⃣ Envia e-mail de notificação ao admin
    // ------------------------------------------------------------
    await enviarEmailAdmin({
      id_adocao,
      nome_doador,
      email_doador,
      telefone_doador,
      nome_crianca,
      sonho,
      ponto_coleta,
    });

    // ------------------------------------------------------------
    // 6️⃣ Atualiza gamificação (tentativa segura)
    // ------------------------------------------------------------
    try {
      const adocoesConfirmadas = await base(T_ADOCOES)
        .select({
          filterByFormula: `AND({email_doador}='${email_doador}', {status_adocao}='confirmada')`,
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
          id_usuario,
          pontos_coracao,
          total_cartinhas_adotadas: total,
          titulo_conquista,
        }),
      });
      console.log("🏆 Gamificação atualizada:", email_doador);
    } catch (gamiErr) {
      console.warn("⚠️ Gamificação falhou:", gamiErr.message);
    }

    return ok(res, { sucesso: true, id_adocao });
  } catch (e) {
    console.error("🔥 Erro interno /api/adocoes:", e);
    return err(res, 500, "Erro interno ao criar adoção.");
  }
}
