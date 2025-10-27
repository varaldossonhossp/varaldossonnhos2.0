// ============================================================
// 💚 VARAL DOS SONHOS — /api/health.js
// ------------------------------------------------------------
// Verifica status da API e conexão com o Airtable
// ------------------------------------------------------------
//   • GET /api/health
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  const resposta = {
    status: "ok",
    projeto: "Varal dos Sonhos 💙",
    versao: "2025.1",
    timestamp: new Date().toISOString(),
    airtable: "não testado",
    tabela_testada: "usuarios",
  };

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const registros = await base("usuarios")
      .select({ maxRecords: 1 })
      .firstPage();

    resposta.airtable = registros.length > 0 ? "conectado ✅" : "sem registros ⚠️";

    return res.status(200).json(resposta);
  } catch (erro) {
    resposta.airtable = "falha ❌";
    resposta.erro = erro.message;
    return res.status(500).json(resposta);
  }
}
