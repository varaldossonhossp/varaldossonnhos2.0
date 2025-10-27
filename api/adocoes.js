// ============================================================
// 🎁 VARAL DOS SONHOS — API Adoções
// ------------------------------------------------------------
// Controla adoções de cartinhas (Airtable)
// Tabelas: adocoes, cartinhas, usuarios
// ============================================================

import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    // ========================================================
    // 1️⃣ LISTAR TODAS AS ADOÇÕES
    // GET /api/adocoes
    // ========================================================
    if (req.method === "GET") {
      const records = await base("adocoes").select().all();

      const lista = records.map(r => {
        const f = r.fields;
        return {
          id: r.id,
          id_doacao: f.id_doacao,
          data_adocao: f.data_adocao,
          id_cartinha: f.id_cartinha,
          id_usuario: f.id_usuario,
          nome_doador: f.nome_doador,
          email_doador: f.email_doador,
          telefone_doador: f.telefone_doador,
          tipo: f.tipo,
          ponto_coleta: f.ponto_coleta,
          status_adocao: f.status_adocao
        };
      });

      return res.status(200).json(lista);
    }

    // ========================================================
    // 2️⃣ CRIAR UMA NOVA ADOÇÃO
    // POST /api/adocoes
    // ========================================================
    if (req.method === "POST") {
      const {
        id_cartinha,
        id_usuario,
        nome_doador,
        email_doador,
        telefone_doador,
        tipo,
        ponto_coleta
      } = req.body;

      if (!id_cartinha || !id_usuario) {
        return res.status(400).json({ erro: "Campos obrigatórios ausentes." });
      }

      // Cria o registro na tabela adocoes
      const created = await base("adocoes").create([
        {
          fields: {
            id_doacao: "DOA-" + Date.now(),
            data_adocao: new Date().toISOString(),
            id_cartinha,
            id_usuario,
            nome_doador,
            email_doador,
            telefone_doador,
            tipo,
            ponto_coleta,
            status_adocao: "aguardando confirmacao"
          }
        }
      ]);

      // Atualiza a cartinha para "adotada"
      await base("cartinhas").update([
        {
          id: id_cartinha,
          fields: { status: "adotada" }
        }
      ]);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Adoção registrada com sucesso!",
        id: created[0].id
      });
    }

    // ========================================================
    // 3️⃣ ATUALIZAR STATUS DE ADOÇÃO
    // PUT /api/adocoes?id=recXXXX
    // body: { status_adocao: "confirmada" }
    // ========================================================
    if (req.method === "PUT") {
      const { id } = req.query;
      const { status_adocao } = req.body;
      if (!id || !status_adocao)
        return res.status(400).json({ erro: "Dados incompletos." });

      await base("adocoes").update([
        {
          id,
          fields: { status_adocao }
        }
      ]);

      return res.status(200).json({ sucesso: true, status: status_adocao });
    }

    // ========================================================
    // 4️⃣ BLOQUEIA OUTROS MÉTODOS
    // ========================================================
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).json({ erro: "Método não permitido." });

  } catch (err) {
    console.error("Erro API adocoes:", err);
    res.status(500).json({ erro: "Erro ao processar adoções." });
  }
}
