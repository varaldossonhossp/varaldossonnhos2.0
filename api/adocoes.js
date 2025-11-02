// ============================================================
// 💙 VARAL DOS SONHOS — /api/adocoes.js (versão revisada 2025-11)
// ------------------------------------------------------------
// Função: registrar uma nova adoção no Airtable
// Campos que podem ser gravados diretamente:
//   - data_adocao (Date)
//   - status_adocao (Single select)
//   - cartinha (Link → tabela cartinha)
//   - usuario (Link → tabela usuarios)
//   - pontos_coleta (Link → tabela pontos_coleta)
// Todos os outros campos (nome_crianca, sonho, e-mails, etc.)
// são preenchidos automaticamente por LOOKUPS no Airtable.
// ============================================================

import Airtable from "airtable";
import enviarEmail from "./lib/enviarEmail.js";

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
    // 🧠 Leitura dos dados enviados pelo front-end
    // ============================================================
    const {
      id_cartinha,
      id_usuario,
      nome_doador,
      email_doador,
      telefone_doador,
      ponto_coleta, // objeto { nome, endereco, telefone, email }
      nome_crianca,
      sonho
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
    // 🔍 Buscar o recordId da cartinha correspondente
    // ============================================================
    const filtro = `OR({id_cartinha}=${id_cartinha}, {id_cartinha}='${id_cartinha}')`;
    console.log("🔍 Filtro usado no Airtable:", filtro);

    const cartinhasEncontradas = await base(tabelaCartinhas)
      .select({ filterByFormula: filtro, maxRecords: 1 })
      .firstPage();

    if (!cartinhasEncontradas || cartinhasEncontradas.length === 0) {
      throw new Error(`Nenhuma cartinha encontrada com o ID ${id_cartinha}`);
    }

    const recordIdCartinha = cartinhasEncontradas[0].id;
    console.log("📄 recordId da cartinha:", recordIdCartinha);

    // ============================================================
    // 🧾 Montagem dos dados para registrar no Airtable
    // ============================================================
    const dadosParaRegistro = {
      data_adocao: new Date().toISOString().split("T")[0], // formato ISO curto
      status_adocao: "aguardando confirmacao",
      cartinha: [recordIdCartinha],
      usuario: [id_usuario],
      pontos_coleta: ponto_coleta?.recordId ? [ponto_coleta.recordId] : [],
    };

    console.log("🧾 Dados prontos para registro:", dadosParaRegistro);

    // ============================================================
    // 🧩 Criação do registro no Airtable
    // ============================================================
    const registroCriado = await base(tabelaAdocoes).create([
      { fields: dadosParaRegistro }
    ]);

    console.log("✅ Adoção registrada com sucesso no Airtable.");

    // ============================================================
    // 💌 Envio do e-mail de confirmação
    // ============================================================
    try {
      await enviarEmail({
        para: email_doador,
        assunto: `💙 Adoção confirmada: ${nome_crianca}`,
        corpo: `
          <h2>💙 Obrigado, ${nome_doador}!</h2>
          <p>Sua adoção da cartinha de <strong>${nome_crianca}</strong> foi registrada com sucesso.</p>
          <p><strong>Sonho:</strong> ${sonho}</p>
          <p><strong>Ponto de coleta:</strong> ${ponto_coleta?.nome || "Não informado"}</p>
          <p>Leve o presente até <strong>${ponto_coleta?.endereco || ""}</strong> até a data limite informada no site.</p>
          <p>Com carinho,<br>Equipe Varal dos Sonhos 💙</p>
        `
      });
      console.log("📧 E-mail de confirmação enviado.");
    } catch (emailErr) {
      console.error("⚠️ Erro ao enviar e-mail:", emailErr.message);
    }

    // ============================================================
    // 🟢 Resposta final
    // ============================================================
    res.status(200).json({
      sucesso: true,
      mensagem: "Adoção registrada com sucesso e e-mail enviado!"
    });

  } catch (erro) {
    console.error("🔥 ERRO INTERNO /api/adocoes:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar adoção.",
      detalhe: erro.message
    });
  }
}
