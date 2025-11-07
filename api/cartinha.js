// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (versão final revisada)
// ------------------------------------------------------------
// • Busca todas as cartinhas disponíveis no Airtable.
// • Retorna somente status = 'disponivel'.
// • Inclui sempre o campo id_cartinha (autonumber) e o recordId.
// • Compatível com front JS e app .NET MAUI.
// ------------------------------------------------------------
// Hospedagem: Vercel (Node.js runtime)
// Banco: Airtable
// Dependências: airtable (npm)
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// ============================================================
// 🔹 Conexão base
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// ============================================================
// 🔹 Headers CORS
// ============================================================
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================
// 🔹 Handler principal
// ============================================================
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // ============================================================
    // GET — Listar cartinhas
    // ============================================================
    if (req.method === "GET") {
      const { status } = req.query;
      const filtro =
        status && status !== "todas" ? `{status}='${status}'` : "";

      const records = await base(tableName)
        .select({
          filterByFormula: filtro,
          sort: [{ field: "data_cadastro", direction: "desc" }],
        })
        .all();

      const cartinha = records.map((r) => ({
        id: r.id,
        id_cartinha: r.fields.id_cartinha ?? null,
        nome_crianca: r.fields.nome_crianca || "",
        primeiro_nome: r.fields.primeiro_nome || "",
        idade: r.fields.idade || "",
        sexo: r.fields.sexo || "",
        sonho: r.fields.sonho || "",
        escola: r.fields.escola || "",
        cidade: r.fields.cidade || "",
        psicologa_responsavel: r.fields.psicologa_responsavel || "",
        telefone_contato: r.fields.telefone_contato || "",
        imagem_cartinha: r.fields.imagem_cartinha || [],
        irmaos: r.fields.irmaos || "",
        idade_irmaos: r.fields.idade_irmaos || "",
        status: r.fields.status || "",
        ponto_coleta: Array.isArray(r.fields.ponto_coleta)
          ? r.fields.ponto_coleta[0]
          : r.fields.ponto_coleta || "",
        data_cadastro: r.fields.data_cadastro || "",
        cadastrado_por: r.fields.cadastrado_por || "",
      }));

      return res.status(200).json({ sucesso: true, total: cartinha.length, cartinha });
    }

    // ============================================================
    // POST — Criar nova cartinha
    // ============================================================
    if (req.method === "POST") {
      const body = req.body;
      
      const statusValido = ["disponível", "adotada"];
      const status = statusValido.includes(body.status) ? body.status : "disponível";

      const novo = await base(tableName).create([
        {
          fields: {
            nome_crianca: body.nome_crianca,
            idade: body.idade,
            sexo: body.sexo,
            sonho: body.sonho,
            imagem_cartinha: body.imagem_cartinha
              ? [{ url: body.imagem_cartinha }]
              : [],
            escola: body.escola,
            cidade: body.cidade,
            psicologa_responsavel: body.psicologa_responsavel,
            telefone_contato: body.telefone_contato,
            status: body.status || "disponível",
          },
        },
      ]);

      return res.status(200).json({ sucesso: true, novo });
    }

    // ============================================================
    // PATCH — Atualizar cartinha
    // ============================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      const body = req.body;

      // Validar status
      const statusValido = ["disponível", "adotada"];
      const status = statusValido.includes(body.status) ? body.status : undefined;

      // Montar campos para atualizar
      const fieldsToUpdate = {
        nome_crianca: body.nome_crianca,
        idade: body.idade,
        sexo: body.sexo,
        sonho: body.sonho,
        imagem_cartinha: body.imagem_cartinha
          ? [{ url: body.imagem_cartinha }]
          : [],
        escola: body.escola,
        cidade: body.cidade,
        psicologa_responsavel: body.psicologa_responsavel,
        telefone_contato: body.telefone_contato,
      };

      // Adicionar status apenas se for válido
      if (status) fieldsToUpdate.status = status;

      const atualizado = await base(tableName).update([
        {
          id,
          fields: fieldsToUpdate,
        },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ============================================================
    // DELETE — Excluir cartinha
    // ============================================================
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório" });

      await base(tableName).destroy([id]);
      return res.status(200).json({ sucesso: true, mensagem: "Cartinha excluída!" });
    }

    // ============================================================
    // Método não suportado
    // ============================================================
    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]);
    return res
      .status(405)
      .json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}

