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
// ============================================================


import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {

  // Inicializa conexão com Airtable usando as chaves seguras da Vercel
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  // ============================================================
  // PUT — Atualização do status de uma adoção (Fluxo de Logística)
  // ------------------------------------------------------------
  // Este bloco é utilizado pelo painel administrativo e pelos
  // pontos de coleta para registrar as etapas da logística:
  //   - presente recebido
  //   - presente entregue
  // Atualiza automaticamente a data do movimento.
  // ============================================================
  if (req.method === "PUT") {
    try {
      const { id, status_adocao } = req.body || {};

      // Validação de dados obrigatórios
      if (!id || !status_adocao) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios ausentes (id, status_adocao).",
        });
      }

      // Atualização no Airtable
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
        message: `Status da adoção atualizado para '${status_adocao}'.`,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao atualizar adoção.",
        detalhe: err.message,
      });
    }
  }

  // ============================================================
  // 🟣 POST — Criação de nova adoção (Fluxo do Doador)
  // ------------------------------------------------------------
  // Este é o fluxo principal utilizado quando o usuário finaliza
  // a adoção no carrinho. Ele:
  //  1. Cria o registro na tabela “adocoes”
  //  2. Marca a cartinha como “adotada”
  //  3. Busca dados complementares das outras tabelas
  //  4. Envia e-mail automático ao administrador
  // ============================================================
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não suportado." });
  }

  try {
    // Dados enviados pelo carrinho.js
    const { nome_crianca_id, nome_usuario_id, pontos_coleta_id, data_evento_id } = req.body || {};

    // Validação de entrada
    if (!nome_crianca_id || !nome_usuario_id || !pontos_coleta_id) {
      return res.status(400).json({
        success: false,
        message:
          "Campos obrigatórios ausentes (nome_crianca_id, nome_usuario_id, pontos_coleta_id).",
      });
    }

    // ============================================================
    // 1️⃣ Criação da adoção no Airtable
    // ------------------------------------------------------------
    // São utilizados registros vinculados (linked records) para
    // relacionar usuário, cartinha e ponto de coleta.
    // ============================================================
    const fieldsToCreate = {
      data_adocao: new Date().toISOString().split("T")[0],
      status_adocao: "aguardando confirmacao",
      nome_crianca: [nome_crianca_id],
      usuario: [nome_usuario_id],
    };

    if (data_evento_id) fieldsToCreate.data_evento = [data_evento_id];
    if (pontos_coleta_id) fieldsToCreate.pontos_coleta = [pontos_coleta_id];

    const novaAdocao = await base("adocoes").create([{ fields: fieldsToCreate }]);
    const idAdocao = novaAdocao[0].id;

    // ============================================================
    // 2️⃣ Atualização da cartinha → status: “adotada”
    // ------------------------------------------------------------
    // Evita que a mesma cartinha apareça como disponível.
    // ============================================================
    try {
      await base("cartinha").update([
        { id: nome_crianca_id, fields: { status: "adotada" } },
      ]);
    } catch (errCart) {}

    // ============================================================
    // 3️⃣ Coleta de dados complementares para envio ao admin
    // ------------------------------------------------------------
    // Busca paralela das três tabelas para melhorar desempenho.
    // ============================================================
    let usuario = { fields: {} }, cartinha = { fields: {} }, ponto = { fields: {} };
    try {
      const [u, c, p] = await Promise.all([
        base("usuario").find(nome_usuario_id),
        base("cartinha").find(nome_crianca_id),
        base("pontos_coleta").find(pontos_coleta_id),
      ]);
      usuario = u; cartinha = c; ponto = p;
    } catch (e) {}

    // Campos tratados para evitar erros se algum estiver vazio
    const u = usuario.fields || {};
    const c = cartinha.fields || {};
    const p = ponto.fields || {};

    const donor_name = u.nome_usuario || "Novo Doador";
    const donor_email = u.email_usuario || "—";
    const donor_phone = u.telefone || "—";

    const child_name = c.nome_crianca || `Cartinha ${nome_crianca_id}`;
    const child_gift = c.sonho || "—";
    const id_cartinha = c.id_cartinha || "—"; // 🔹 Número da cartinha

    const pickup_name = p.nome_ponto || "—";
    const pickup_address = p.endereco || "—";
    const pickup_number = p.numero || "—"; // 🔹 Número do endereço
    const pickup_cep = p.cep || "—";       // 🔹 CEP do ponto
    const pickup_phone = p.telefone_ponto || p.telefone || "—";

    // ============================================================
    // 4️⃣ Envio de e-mail automático ao administrador
    // ------------------------------------------------------------
    // Esta etapa gera o e-mail de notificação usando EmailJS,
    // contendo todos os detalhes da adoção para conferência.
    // ============================================================
    try {
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = process.env.EMAILJS_TEMPLATE_ADMIN_ID;
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;
      const privateKey = process.env.EMAILJS_PRIVATE_KEY;

      const appBase = "https://varaldossonhos2-0.vercel.app";
      const confirmationLink = `${appBase}/api/confirmar?id_adocao=${idAdocao}`;

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
          id_cartinha,
          pickup_name,
          pickup_address,
          pickup_number,
          pickup_cep,
          pickup_phone,
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

      console.log("📨 E-mail enviado ao administrador.");
    } catch {}

    // ============================================================
    // 5️⃣ Retorno para o front-end
    // ------------------------------------------------------------
    // Esta resposta é utilizada pelo carrinho.js para mostrar a
    // mensagem de sucesso ao doador.
    // ============================================================
    return res.status(200).json({
      success: true,
      message: "Adoção criada e administrador notificado.",
      id_adocao: idAdocao,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar adoção.",
      detalhe: error.message,
    });
  }
}
