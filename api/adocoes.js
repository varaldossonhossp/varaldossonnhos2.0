// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js
// ------------------------------------------------------------
// // Esta função serverless, hospedada na Vercel, executa toda a
// lógica de criação e atualização das adoções. 
//
// Ela é responsável por:
//  • Criar novas adoções (POST)
//  • Atualizar status da adoção (PUT)
//  • Atualizar o status da cartinha no Airtable
//  • Buscar dados complementares (usuario, cartinha, ponto)
//  • Disparar e-mail automático para o administrador
//
// Funções principais:
// • POST → Cria nova adoção pelo usuário
// • PUT  → Atualiza status_adocao (usado por voluntários / logística)
// • Atualiza a tabela cartinha → status “adotada”
// • Envia e-mail ao ADMIN com link de confirmação
// • Realiza buscas cruzadas em 3 tabelas para compor o e-mail
//
// Tabelas acessadas:
// • adocoes
// • cartinha
// • usuario
// • pontos_coleta
//
// Arquivos do front que chamam esta API:
// • js/carrinho.js        → POST (criar adoção)
// • js/logistica.js       → PUT (atualizar status)
// • pages/carrinho.html   → fluxo público de adoção
// • pages/logistica.html  → fluxo interno de logística/voluntários
//
// Funções internas:
// • handler()
// • PUT → atualizarStatus()
// • POST → criarAdoção()
// • Função interna: buscaDetalhada() (Promise.all)
// • Função interna: enviaEmailAdmin()
//
//  ✔ Campos corretos do Airtable (cartinha, usuario, pontos_coleta)
//  ✔ Uso de recordId real em linked records
//  ✔ Atualização correta do status da cartinha
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  // ============================================================
  // PUT — Atualiza status da adoção
  // ============================================================
  if (req.method === "PUT") {
    try {
      const { id, status_adocao } = req.body || {};

      if (!id || !status_adocao) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios ausentes (id, status_adocao).",
        });
      }

      await base("adocoes").update([
        {
          id,
          fields: {
            status_adocao,
            data_recebimento: new Date().toISOString().split("T")[0],
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: `Status atualizado para '${status_adocao}'.`,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar adoção.",
        detalhe: err.message,
      });
    }
  }

  // ============================================================
  // POST — Criação de nova adoção
  // ============================================================
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método não suportado.",
    });
  }

  try {
    const {
      cartinha,       // recordId da cartinha
      usuario,        // recordId do usuário
      pontos_coleta,  // recordId do ponto
      eventos         // opcional: recordId do evento
    } = req.body || {};

    // ----------- VALIDAÇÃO -----------
    if (!cartinha || !usuario || !pontos_coleta) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes: cartinha, usuario, pontos_coleta",
      });
    }

    // ============================================================
    // 1️⃣ Criar adoção no Airtable (LINKED RECORDS CORRETOS)
    // ============================================================
    const camposAdoacao = {
      data_adocao: new Date().toISOString().split("T")[0],
      status_adocao: "aguardando confirmacao",
      cartinha: [cartinha],
      usuario: [usuario],
      pontos_coleta: [pontos_coleta],
    };

    if (eventos) {
      camposAdoacao.eventos = [eventos];
    }

    const novaAdocao = await base("adocoes").create([{ fields: camposAdoacao }]);
    const idAdocao = novaAdocao[0].id;

    // ============================================================
    // 2️⃣ Atualiza cartinha para status “adotada”
    // ============================================================
    try {
      await base("cartinha").update([
        { id: cartinha, fields: { status: "adotada" } },
      ]);
    } catch (errCart) {
      console.log("⚠ Erro ao atualizar cartinha:", errCart.message);
    }

    // ============================================================
    // 3️⃣ Busca informações complementares (para email)
    // ============================================================
    let usuarioObj = {}, cartinhaObj = {}, pontoObj = {};

    try {
      const [u, c, p] = await Promise.all([
        base("usuario").find(usuario),
        base("cartinha").find(cartinha),
        base("pontos_coleta").find(pontos_coleta),
      ]);

      usuarioObj = u.fields;
      cartinhaObj = c.fields;
      pontoObj = p.fields;
    } catch (e) {
      console.log("⚠ Erro ao buscar dados detalhados.");
    }

    // ============================================================
    // 4️⃣ Envio do e-mail ao administrador
    // ============================================================
    try {
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = process.env.EMAILJS_TEMPLATE_ADMIN_ID;
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;
      const privateKey = process.env.EMAILJS_PRIVATE_KEY;

      const confirmationLink =
        `https://varaldossonhos2-0.vercel.app/api/confirmar?id_adocao=${idAdocao}`;

      const emailBody = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          donor_name: usuarioObj.nome_usuario || "Doador",
          donor_email: usuarioObj.email_usuario || "—",
          donor_phone: usuarioObj.telefone || "—",
          child_name: cartinhaObj.nome_crianca || "—",
          child_gift: cartinhaObj.sonho || "—",
          pickup_name: pontoObj.nome_ponto || "—",
          pickup_address: pontoObj.endereco || "—",
          pickup_number: pontoObj.numero || "—",
          pickup_cep: pontoObj.cep || "—",
          order_id: idAdocao,
          confirmation_link: confirmationLink,
          to_email: process.env.EMAILJS_ADMIN_EMAIL,
        },
      };

      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailBody),
      });

    } catch (e) {
      console.log("⚠ Falha ao enviar e-mail:", e.message);
    }

    // ============================================================
    // 5️⃣ Resposta final
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Adoção criada com sucesso!",
      id_adocao: idAdocao,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar adoção.",
      detalhe: e.message,
    });
  }
}
