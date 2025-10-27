// ============================================================
// 💌 VARAL DOS SONHOS — API Cartinhas
// ------------------------------------------------------------
// Fornece lista de cartinhas e detalhes individuais
// Tabela: cartinhas (Airtable)
// ============================================================

import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    // Se for GET com um ID (ex: /api/cartinhas?id=rec123)
    if (req.method === "GET" && req.query.id) {
      const record = await base("cartinhas").find(req.query.id);
      if (!record) return res.status(404).json({ erro: "Cartinha não encontrada" });

      const f = record.fields;
      return res.status(200).json({
        id: record.id,
        nome_crianca: f.nome_crianca,
        primeiro_nome: f.primeiro_nome,
        sexo: f.sexo,
        idade: f.idade,
        sonho: f.sonho,
        escola: f.escola,
        cidade: f.cidade,
        psicologa_responsavel: f.psicologa_responsavel,
        telefone_contato: f.telefone_contato,
        imagem_cartinha: f.imagem_cartinha,
        irmaos: f.irmaos,
        idade_irmaos: f.idade_irmaos,
        status: f.status,
        data_cadastro: f.data_cadastro
      });
    }

    // Se for GET geral (lista de cartinhas disponíveis)
    if (req.method === "GET") {
      const records = await base("cartinhas")
        .select({ filterByFormula: "status = 'disponível'" })
        .all();

      const lista = records.map(r => {
        const f = r.fields;
        return {
          id: r.id,
          nome_crianca: f.nome_crianca,
          primeiro_nome: f.primeiro_nome,
          idade: f.idade,
          sonho: f.sonho,
          cidade: f.cidade,
          imagem_cartinha: f.imagem_cartinha,
          status: f.status
        };
      });

      return res.status(200).json(lista);
    }

    // Bloqueia métodos não suportados
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ erro: "Método não permitido" });

  } catch (err) {
    console.error("Erro API cartinhas:", err);
    res.status(500).json({ erro: "Erro ao carregar cartinhas" });
  }
}
