// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (versão final TCC Cloudinary)
// ------------------------------------------------------------
// 🔹 Upload de imagem via Cloudinary (URL pública enviada pelo front-end)
// 🔹 Compatível com Vercel (sem uso de Base64 nem Buffer)
// 🔹 Validação de campos Single Select (sexo, status)
// 🔹 NOVO: integração com eventos (nome_evento, data_evento, data_limite_recebimento, evento_id)
// 🔹 Mantém GET, POST, PATCH, DELETE e CORS originais
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable";

// ============================================================
// ⚙️ CONFIGURAÇÃO ESSENCIAL PARA FORM-DATA NO VERCEL
// ============================================================
export const config = {
  api: { bodyParser: false }, // ❗ Obrigatório para Formidable
  runtime: "nodejs",
};

// ============================================================
// 🔹 Conexão com Airtable
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// ============================================================
// 🔹 Função utilitária para CORS
// ============================================================
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================
// 🔄 Parser de formulário multipart (para arquivos e campos)
// ============================================================
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const parsedFields = {};
      for (const key in fields) parsedFields[key] = fields[key][0];
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

    // ============================================================
    // 🔹 GET — Lista de cartinhas (com filtro opcional por evento)
    // ============================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      let selectConfig = {
        sort: [{ field: "data_cadastro", direction: "desc" }],
      };

      // ✅ Filtra por evento (se parâmetro presente)
      if (evento) {
        selectConfig = {
          ...selectConfig,
          filterByFormula: `{evento_id} = "${evento}"`,
        };
      }

      const records = await base(tableName).select(selectConfig).all();

      const cartinha = records.map((r) => ({
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
        status: r.fields.status || "",
        nome_evento: r.fields.nome_evento || "",
        data_evento: r.fields.data_evento || "",
        data_limite_recebimento: r.fields.data_limite_recebimento || "",
        evento_id: r.fields.evento_id || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ============================================================
    // 🔹 POST — Criação de nova cartinha
    // ============================================================
    if (req.method === "POST") {
      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const sexo = sexoValido.includes((body.sexo || "").toLowerCase())
        ? body.sexo.toLowerCase()
        : "menino";
      const status = statusValido.includes((body.status || "").toLowerCase())
        ? body.status.toLowerCase()
        : "disponivel";

      // ✅ URL Cloudinary enviada pelo front-end
      let imagem_cartinha = [];
      try {
        imagem_cartinha = body.imagem_cartinha
          ? JSON.parse(body.imagem_cartinha)
          : [];
      } catch {
        imagem_cartinha = [];
      }

      // ✅ Campos de evento (novos)
      const nome_evento = body.nome_evento || "";
      const data_evento = body.data_evento || "";
      const data_limite_recebimento = body.data_limite_recebimento || "";
      const evento_id = body.evento_id || "";

      const novo = await base(tableName).create([
        {
          fields: {
            nome_crianca: body.nome_crianca,
            idade: parseInt(body.idade) || null,
            sexo,
            sonho: body.sonho,
            imagem_cartinha,
            escola: body.escola,
            cidade: body.cidade,
            telefone_contato: body.telefone_contato,
            psicologa_responsavel: body.psicologa_responsavel,
            status,
            nome_evento,
            data_evento,
            data_limite_recebimento,
            evento_id,
          },
        },
      ]);

      return res.status(200).json({ sucesso: true, novo });
    }

    // ============================================================
    // 🔹 PATCH — Atualizar cartinha existente (ou inativar)
    // ============================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id)
        return res
          .status(400)
          .json({ sucesso: false, mensagem: "ID obrigatório para atualização." });

      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const sexo = sexoValido.includes((body.sexo || "").toLowerCase())
        ? body.sexo.toLowerCase()
        : undefined;
      const status = statusValido.includes((body.status || "").toLowerCase())
        ? body.status.toLowerCase()
        : undefined;

      const fieldsToUpdate = {
        nome_crianca: body.nome_crianca,
        idade: parseInt(body.idade) || null,
        sonho: body.sonho,
        escola: body.escola,
        cidade: body.cidade,
        telefone_contato: body.telefone_contato,
        psicologa_responsavel: body.psicologa_responsavel,
      };

      if (sexo) fieldsToUpdate.sexo = sexo;
      if (status) fieldsToUpdate.status = status;

      // ✅ Atualização de imagem
      if (body.imagem_cartinha) {
        try {
          const img = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(img)) fieldsToUpdate.imagem_cartinha = img;
        } catch {
          console.warn("⚠️ imagem_cartinha inválida no PATCH");
        }
      }

      // ✅ Atualização de vínculo de evento (mantém se vier do front)
      if (body.nome_evento) fieldsToUpdate.nome_evento = body.nome_evento;
      if (body.data_evento) fieldsToUpdate.data_evento = body.data_evento;
      if (body.data_limite_recebimento)
        fieldsToUpdate.data_limite_recebimento = body.data_limite_recebimento;
      if (body.evento_id) fieldsToUpdate.evento_id = body.evento_id;

      const atualizado = await base(tableName).update([
        { id, fields: fieldsToUpdate },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ============================================================
    // 🔹 DELETE — Exclusão permanente (mantido para compatibilidade)
    // ============================================================
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

      await base(tableName).destroy([id]);
      return res.status(200).json({ sucesso: true, mensagem: "Cartinha excluída!" });
    }

    // ============================================================
    // ❌ Método não suportado
    // ============================================================
    res
      .status(405)
      .json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}
