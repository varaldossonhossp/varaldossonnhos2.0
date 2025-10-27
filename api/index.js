// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js
// ------------------------------------------------------------
// Endpoint de status e listagem das rotas ativas.
// Compatível com o plano gratuito da Vercel.
// ============================================================

export const config = { runtime: "nodejs" };

export default function handler(req, res) {
  res.status(200).json({
    status: "API Varal dos Sonhos 💙",
    versao: "2025.1",
    ambiente: process.env.VERCEL_ENV || "local",
    endpoints: [
      "/api/health",
      "/api/cartinhas",
      "/api/adocoes",
      "/api/pontosdecoleta",
      "/api/eventos",
      "/api/galeria",
      "/api/cloudinho",
      "/api/login",
      "/api/cadastro",
      "/api/gamificacao",
    ],
  });
}


