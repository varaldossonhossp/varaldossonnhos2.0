// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js
// ------------------------------------------------------------
// - API para gerenciar as cartinhas das crianças:
//   • Listar cartinhas (GET)
//   • Criar nova cartinha (POST)
//   • Editar cartinha existente (PATCH)
//   • Excluir cartinha (DELETE)
// - Compatível com uploads de imagem via Cloudinary
// - Utiliza form-data (formidable) para POST e PATCH
// - Compatível com Vercel (form-data + formidable)
// - Campos alinhados com a tabela "cartinha" do Airtable:
//
//   Tabela CARTINHA – campos usados aqui:
//   - nome_crianca          (Single line text)
//   - primeiro_nome         (Formula)
//   - idade                 (Number)
//   - sexo                  (Single select: menino/menina/outro)
//   - sonho                 (Long text)
//   - escola                (Single line text)
//   - cidade                (Single line text)
//   - telefone_contato      (Single line text)
//   - psicologa_responsavel (Single line text)
//   - imagem_cartinha       (Attachment)
//   - irmaos                (Number)
//   - idade_irmaos          (Single line text)
//   - observacoes_admin     (Long text)
//   - status                (Single select: disponivel/adotada/inativa)
//   - id_evento             (Linked record → eventos)
//  - id_evento é um linked record que referencia a tabela "eventos".
//    Na resposta da API, o nome do evento é retornado no campo
//    evento_nome, que é gerado dinamicamente a partir do ID.
//
// - Mantém GET, PATCH e DELETE funcionando normalmente.
// - Adiciona suporte a POST (criação de nova cartinha)
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable";

export const config = {
  api: { bodyParser: false },
  runtime: "nodejs",
};

// Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// CORS
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Parse form-data
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      const parsedFields = {};
      for (const key in fields) {
        parsedFields[key] = Array.isArray(fields[key])
          ? fields[key][0]
          : fields[key];
      }

      resolve({ fields: parsedFields, files });
    });
  });
}

// ============================================================
// 🔹 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    let body = req.body;

    if (req.method === "POST" || req.method === "PATCH") {
      const parsed = await parseForm(req);
      body = parsed.fields;
    }

    // ========================================================
    // 🔹 GET — Listar cartinhas (AGORA COM evento_nome)
    // ========================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      let selectConfig = {
        sort: [{ field: "data_cadastro", direction: "desc" }],
      };

      if (evento) {
        selectConfig.filterByFormula = `{id_evento} = "${evento}"`;
      }

      const records = await base(tableName).select(selectConfig).all();

      // 🔹 Carregar eventos uma única vez
      const eventosAirtable = await base("eventos").select().all();
      const eventosMap = {};

      eventosAirtable.forEach((ev) => {
        eventosMap[ev.id] = ev.fields.nome_evento || "";
      });

      const cartinha = records.map((r) => {
        const idEventos = r.fields.id_evento || [];

        return {
          id: r.id,
          nome_crianca: r.fields.nome_crianca || "",
          idade: r.fields.idade || "",
          sexo: r.fields.sexo || "",
          sonho: r.fields.sonho || "",
          escola: r.fields.escola || "",
          cidade: r.fields.cidade || "",
          telefone_contato: r.fields.telefone_contato || "",
          psicologa_responsavel: r.fields.psicologa_responsavel || "",
          imagem_cartinha: r.fields.imagem_cartinha || [],
          irmaos: r.fields.irmaos ?? null,
          idade_irmaos: r.fields.idade_irmaos || "",
          status: r.fields.status || "",
          observacoes_admin: r.fields.observacoes_admin || "",
          id_evento: idEventos,
          // 🔥 Nome do evento expandido
          evento_nome: idEventos.map((id) => eventosMap[id] || "").join(", "),
        };
      });

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ========================================================
    // 🔹 POST — Criar
    // ========================================================
    if (req.method === "POST") {
      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const sexo = sexoValido.includes((body.sexo || "").toLowerCase())
        ? body.sexo.toLowerCase()
        : "menina";

      const status = statusValido.includes((body.status || "").toLowerCase())
        ? body.status.toLowerCase()
        : "disponivel";

      // irmãos
      let irmaosNumber = null;
      if (body.irmaos !== undefined && body.irmaos !== "") {
        const n = parseInt(String(body.irmaos).replace(/\D/g, ""), 10);
        if (!Number.isNaN(n)) irmaosNumber = n;
      }

      const idade_irmaos = body.idade_irmaos || "";

      // imagem
      let imagem_cartinha = [];
      try {
        if (body.imagem_cartinha) {
          const arr = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(arr)) {
            imagem_cartinha = arr.map((i) =>
              typeof i === "string" ? { url: i } : i
            );
          }
        }
      } catch {
        imagem_cartinha = [];
      }

      const fields = {
        nome_crianca: body.nome_crianca,
        idade: body.idade ? parseInt(body.idade, 10) : null,
        sexo,
        sonho: body.sonho,
        escola: body.escola,
        cidade: body.cidade,
        telefone_contato: body.telefone_contato,
        psicologa_responsavel: body.psicologa_responsavel,
        observacoes_admin: body.observacoes_admin || "",
        status,
        idade_irmaos,
      };

      if (irmaosNumber !== null) fields.irmaos = irmaosNumber;

      // 🔹 vincular evento
      if (body.id_evento) {
        fields.id_evento = [body.id_evento];
      }

      if (imagem_cartinha.length > 0) fields.imagem_cartinha = imagem_cartinha;

      const novo = await base(tableName).create([{ fields }]);
      return res.status(200).json({ sucesso: true, novo });
    }

    // ========================================================
    // 🔹 PATCH — Atualizar
    // ========================================================
    if (req.method === "PATCH") {
      const { id } = req.query;

      if (!id)
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório para atualização.",
        });

      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const fieldsToUpdate = {
        nome_crianca: body.nome_crianca,
        idade: body.idade ? parseInt(body.idade, 10) : null,
        sonho: body.sonho,
        escola: body.escola,
        cidade: body.cidade,
        telefone_contato: body.telefone_contato,
        psicologa_responsavel: body.psicologa_responsavel,
        observacoes_admin: body.observacoes_admin || "",
        idade_irmaos: body.idade_irmaos || "",
      };

      if (sexoValido.includes((body.sexo || "").toLowerCase())) {
        fieldsToUpdate.sexo = body.sexo.toLowerCase();
      }

      if (statusValido.includes((body.status || "").toLowerCase())) {
        fieldsToUpdate.status = body.status.toLowerCase();
      }

      // irmãos
      if (body.irmaos !== undefined) {
        if (body.irmaos === "") {
          fieldsToUpdate.irmaos = null;
        } else {
          const n = parseInt(String(body.irmaos).replace(/\D/g, ""), 10);
          if (!Number.isNaN(n)) fieldsToUpdate.irmaos = n;
        }
      }

      // imagem
      if (body.imagem_cartinha) {
        try {
          const arr = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(arr)) {
            fieldsToUpdate.imagem_cartinha = arr.map((i) =>
              typeof i === "string" ? { url: i } : i
            );
          }
        } catch {}
      }

      // 🔹 atualizar evento
      if (body.id_evento) {
        fieldsToUpdate.id_evento = [body.id_evento];
      }

      const atualizado = await base(tableName).update([
        { id, fields: fieldsToUpdate },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ========================================================
    // 🔹 DELETE
    // ========================================================
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório.",
        });

      await base(tableName).destroy([id]);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Cartinha excluída!",
      });
    }

    res.status(405).json({
      sucesso: false,
      mensagem: `Método ${req.method} não permitido.`,
    });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: e.message || "Erro interno no servidor.",
    });
  }
}