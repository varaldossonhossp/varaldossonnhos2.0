// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão 2025-11, sem envio de e-mail servidor)
// ------------------------------------------------------------
// Função: registrar uma nova adoção no Airtable
// Campos gravados diretamente:
//   - data_adocao
//   - status_adocao
//   - cartinha (Link → cartinha)
//   - usuario (Link → usuarios)
//   - pontos_coleta (Link → pontos_coleta)
// Todos os demais (nome_crianca, sonho, etc.) vêm via Lookups.
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ============================================================
  // 🧩 CORS e método HTTP
  // ============================================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      mensagem: "Método não suportado."
    });
  }

  try {
    // ============================================================
    // 🧠 Dados recebidos do front-end
    // ============================================================
    const {
      id_cartinha,
      id_usuario,
      ponto_coleta // opcional, pode ser recordId ou objeto
    } = req.body;

    console.log("📦 Body recebido:", req.body);

    // ============================================================
    // 🧩 Conexão com Airtable
    // ============================================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
    const tabelaAdocoes = process.env.AIRTABLE_ADOCOES_TABLE || "adocoes";
    const tabelaCartinhas = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

    // ============================================================
    // 🔍 Buscar recordId da cartinha
    // ============================================================
    const filtro = `OR({id_cartinha}=${id_cartinha}, {id_cartinha}='${id_cartinha}')`;
    const cartinhas = await base(tabelaCartinhas)
      .select({ filterByFormula: filtro, maxRecords: 1 })
      .firstPage();

    if (!cartinhas || cartinhas.length === 0) {
      throw new Error(`Nenhuma cartinha encontrada com o ID ${id_cartinha}`);
    }

    const recordIdCartinha = cartinhas[0].id;

    // ============================================================
    // 🧾 Dados para criação do registro
    // ============================================================
    const dados = {
      data_adocao: new Date().toISOString().split("T")[0],
      status_adocao: "aguardando confirmacao",
      cartinha: [recordIdCartinha],
      usuario: [id_usuario],
    };

    if (ponto_coleta?.recordId) {
      dados.pontos_coleta = [ponto_coleta.recordId];
    }

    console.log("🧾 Dados para registro:", dados);

    // ============================================================
    // 🪶 Criação do registro na tabela adocoes
    // ============================================================
    await base(tabelaAdocoes).create([{ fields: dados }]);

    console.log("✅ Registro criado no Airtable.");

    // ============================================================
    // 💙 Resposta para o front-end (onde o EmailJS é chamado)
    // ============================================================
    res.status(200).json({
      sucesso: true,
      mensagem: "Adoção registrada com sucesso no Airtable. O e-mail será enviado pelo front-end."
    });

  } catch (erro) {
    console.error("🔥 Erro interno /api/adocoes:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar adoção.",
      detalhe: erro.message
    });
  }
}
