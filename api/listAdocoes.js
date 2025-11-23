// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js
// ------------------------------------------------------------
// OBJETIVO DA API:
// ------------------------------------------------------------
// Esta rota fornece ao painel administrativo de logística uma
// lista COMPLETA de todas as adoções registradas no sistema,
// já com os dados "expandindo" os relacionamentos (JOIN real)
// entre as tabelas:
//
//   • adocoes
//   • cartinha
//   • usuario
//   • pontos_coleta
//
// Por que isso é necessário?
// ---------------------------
// A API do Airtable NÃO envia automaticamente campos LOOKUP,
// mesmo que eles apareçam na interface do Airtable. Portanto,
// todo relacionamento precisa ser buscado manualmente para
// devolver ao front-end um objeto consolidado.
//
// Como funciona?
// ---------------------------
// Para cada adoção:
//   1. Busca o registro base em "adocoes"
//   2. Lê o ID da cartinha (campo ligado: nome_crianca)
//   3. Busca os dados da cartinha (nome, sonho, id_cartinha)
//   4. Lê o ID do usuário (campo ligado: usuario)
//   5. Busca dados do doador (nome, email, telefone)
//   6. Lê o ID do ponto de coleta (campo ligado: pontos_coleta)
//   7. Busca dados do ponto (nome_ponto)
//   8. Consolida tudo em um único JSON limpo
//
// Isso permite que o painel logístico mostre:
//   ✔ Nome da criança
//   ✔ Sonho escolhido
//   ✔ Nome e contato do doador
//   ✔ Ponto de entrega
//   ✔ Status da adoção
// ------------------------------------------------------------
// Esta API é utilizada em:
//   • pages/logistica-admin.html
//   • js/logistica-admin.js
//   • /api/logistica.js (para validar pontos e confirmar ações)
// ------------------------------------------------------------
// OBJETIVO:
// Fornecer ao painel de logística uma lista COMPLETA das adoções,
// expandindo os relacionamentos entre:
//
//   • adocoes
//   • cartinha
//   • usuario
//   • pontos_coleta
//
// Como o Airtable NÃO envia automaticamente LOOKUPS,
// buscamos manualmente os dados.
// ============================================================
// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js (VERSÃO FINAL 2025)
// ------------------------------------------------------------
// OBJETIVO:
// Retornar ao painel ADMIN e ao painel PONTO uma lista COMPLETA
// das adoções, já com:
//   • dados da cartinha
//   • dados do doador
//   • dados do ponto de coleta
//   • TODAS as movimentações (recebimento / retirada)
// ------------------------------------------------------------
// Fundamental para exibir no painel do ponto:
//   ✔ Responsável pelo recebimento
//   ✔ Observações
//   ✔ Data da movimentação
//   ✔ Responsável pela retirada
//   ✔ Foto do presente (opcional)
// ------------------------------------------------------------
// IMPORTANTE: Airtable NÃO envia LOOKUPS automaticamente,
// por isso buscamos manualmente todas as tabelas relacionadas.
// ============================================================
// ============================================================
// 💙 VARAL DOS SONHOS — /api/listAdocoes.js (VERSÃO FINAL 2025)
// ------------------------------------------------------------
// OBJETIVO:
// Retornar ao painel ADMIN e ao painel PONTO uma lista COMPLETA
// das adoções, contendo:
//
//   • dados da cartinha
//   • dados do usuário (doador)
//   • dados do ponto de coleta
//   • histórico COMPLETO das movimentações do ponto
//
// Mantido 100% compatível com:
//   ✔ painel logistica-admin
//   ✔ painel ponto de coleta
//   ✔ API /api/logistica.js
//
// Nenhuma função ou campo foi alterado ou removido.
// Somente corrigido o filtro de movimentos.
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Inicializa conexão
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não permitido. Use GET.",
    });
  }

  try {
    // --------------------------------------------------------
    // BUSCA TODAS AS ADOÇÕES
    // --------------------------------------------------------
    const records = await base("adocoes")
      .select({
        sort: [{ field: "id_doacao", direction: "asc" }],
      })
      .all();

    const adocoes = [];

    for (const r of records) {
      const f = r.fields || {};

      // ======================================================
      // 1) BUSCAR CARTINHA
      // ======================================================
      let cart = {};
      const idCartinha = f.cartinha?.[0];

      if (idCartinha) {
        try {
          cart = await base("cartinha").find(idCartinha);
        } catch (e) {
          console.log("Erro ao buscar cartinha:", e);
        }
      }

      const nomeCompleto = cart.fields?.nome_crianca || "";
      const primeiroNome = nomeCompleto.split(" ")[0] || nomeCompleto;

      // ======================================================
      // 2) BUSCAR USUÁRIO (doador)
      // ======================================================
      let usuario = {};
      const idUsuario = f.usuario?.[0];

      if (idUsuario) {
        try {
          usuario = await base("usuario").find(idUsuario);
        } catch (e) {
          console.log("Erro ao buscar usuário:", e);
        }
      }

      // ======================================================
      // 3) BUSCAR PONTO DE COLETA
      // ======================================================
      let ponto = {};
      const idPonto = f.pontos_coleta?.[0];

      if (idPonto) {
        try {
          ponto = await base("pontos_coleta").find(idPonto);
        } catch (e) {
          console.log("Erro ao buscar ponto de coleta:", e);
        }
      }

      // ======================================================
      // 4) BUSCAR MOVIMENTAÇÕES (recebimento / retirada)
      // ======================================================
      let movimentos = [];

      try {
        const movRecords = await base("ponto_movimentos")
          .select({
            /**
             * CORREÇÃO FUNDAMENTAL
             * ---------------------
             * Antes: `{adocoes} = '${r.id}'` ← ERRADO para Linked Records
             *
             * Agora: SEARCH + ARRAYJOIN
             * Funciona com arrays, 1 registro ou vários.
             */
            filterByFormula: `SEARCH('${r.id}', ARRAYJOIN({adocoes}))`,
            sort: [{ field: "data_movimento", direction: "asc" }],
          })
          .all();

        movimentos = movRecords.map(m => ({
          tipo_movimento: m.fields?.tipo_movimento || "",
          data_movimento: m.fields?.data_movimento || "",
          responsavel: m.fields?.responsavel || "",
          observacoes: m.fields?.observacoes || "",
          foto_presente: m.fields?.foto_presente?.[0]?.url || "",
        }));
      } catch (e) {
        console.log("Erro ao buscar movimentos do ponto:", e);
      }

      // ======================================================
      // OBJETO FINAL PARA O FRONT-END (NÃO FOI ALTERADO)
      // ======================================================
      adocoes.push({
        id_record: r.id,

        // Dados da cartinha
        id_cartinha: cart.fields?.id_cartinha || "",
        nome_crianca: primeiroNome,
        nome_crianca_completo: nomeCompleto,
        sonho: cart.fields?.sonho || "",

        // Dados do usuário
        nome_usuario: usuario.fields?.nome_usuario || "",
        email_usuario: usuario.fields?.email_usuario || "",
        telefone_usuario: usuario.fields?.telefone || "",

        // Dados do ponto
        id_ponto: idPonto || "",
        nome_ponto: ponto.fields?.nome_ponto || "",
        endereco_ponto: ponto.fields?.endereco || "",
        numero_ponto: ponto.fields?.numero || "",
        cep_ponto: ponto.fields?.cep || "",
        telefone_ponto: ponto.fields?.telefone || "",

        // Status atual
        status_adocao: f.status_adocao || "aguardando confirmacao",

        // Histórico completo do ponto
        movimentos,
      });
    }

    // ------------------------------------------------------
    // RETORNO FINAL
    // ------------------------------------------------------
    return res.status(200).json({
      sucesso: true,
      adocoes,
    });

  } catch (error) {
    console.error("🔥 ERRO API listAdocoes:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar adoções.",
      detalhe: error.message,
    });
  }
}
