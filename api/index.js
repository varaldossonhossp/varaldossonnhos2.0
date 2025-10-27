// ============================================================
// 🩵 VARAL DOS SONHOS — /api/index.js
// ------------------------------------------------------------
// Health check e listagem de rotas ativas.
// ============================================================

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    return res.status(200).json({
      sucesso: true,
      projeto: "💙 Varal dos Sonhos 2.0",
      versao: "API v2 - 2025",
      servidor: "Vercel Edge / Node 20.x",
      status: "online",
      rotas: [
        "/api/index",
        "/api/admin",
        "/api/eventos",
        "/api/cartinhas",
        "/api/adocoes",
        "/api/pontosdecoleta",
        "/api/usuarios",
        "/api/cloudinho",
        "/api/gamificacao",
        "/api/regras_gamificacao",
        "/api/email",
      ],
      ambiente: process.env.VERCEL_ENV || "production",
    });
  }

  return res.status(405).json({ sucesso: false, mensagem: "Método não suportado." });
}
