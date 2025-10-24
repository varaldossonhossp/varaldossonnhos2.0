export const config = { runtime: "nodejs" };

export default function handler(req, res) {
  res.status(200).json({
    status: "API Varal dos Sonhos 💙",
    versao: "2025.1",
    endpoints: [
      "/api/cartinhas",
      "/api/adocoes",
      "/api/pontosDeColeta",
      "/api/eventos",
      "/api/galeria",
      "/api/cloudinho",
      "/api/login",
      "/api/cadastro",
      "/api/gamificacao",
    ],
  });
}
