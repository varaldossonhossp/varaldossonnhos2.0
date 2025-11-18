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
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Inicializa conexão com o Airtable
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
    const records = await base("adocoes")
      .select({
        sort: [{ field: "id_doacao", direction: "asc" }],
      })
      .all();

    const adocoes = [];

    for (const r of records) {
      const f = r.fields || {};

      // Cartinha
      let cart = {};
      const idCartinha = f.nome_crianca?.[0];
      if (idCartinha) {
        try {
          cart = await base("cartinha").find(idCartinha);
        } catch (e) {}
      }

      // Usuário
      let usuario = {};
      const idUsuario = f.usuario?.[0];
      if (idUsuario) {
        try {
          usuario = await base("usuario").find(idUsuario);
        } catch (e) {}
      }

      // Ponto de coleta
      let ponto = {};
      const idPonto = f.pontos_coleta?.[0];  // <--- ID REAL DO PONTO
      if (idPonto) {
        try {
          ponto = await base("pontos_coleta").find(idPonto);
        } catch (e) {}
      }

      // OBJETO FINAL
      adocoes.push({
        id_record: r.id,

        // Criança
        id_cartinha: cart.fields?.id_cartinha || "",
        nome_crianca: cart.fields?.nome_crianca || "",
        sonho: cart.fields?.sonho || "",

        // Usuário
        nome_usuario: usuario.fields?.nome_usuario || "",
        email_usuario: usuario.fields?.email_usuario || "",
        telefone_usuario: usuario.fields?.telefone || "",

        // Ponto (CORREÇÃO AQUI)
        id_ponto: idPonto || "",
        nome_ponto: ponto.fields?.nome_ponto || "",

        // Status
        status_adocao: f.status_adocao || "aguardando confirmacao",
      });
    }

    return res.status(200).json({
      sucesso: true,
      adocoes,
    });

  } catch (error) {
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar adoções.",
      detalhe: error.message,
    });
  }
}
