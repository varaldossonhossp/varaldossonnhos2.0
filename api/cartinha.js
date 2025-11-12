// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (VERSÃO FINAL CORRIGIDA)
// ------------------------------------------------------------
// ✅ CORREÇÕES APLICADAS:
// - Leitura de campos LOOKUP com nome exato no GET.
// - Lógica condicional no POST/PATCH para evitar 'INVALID_RECORD_ID' ("").
// - Ajuste no PATCH para apenas atualizar campos que foram enviados.
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
      // Garante que fields seja um objeto simples (Formidable retorna array no Vercel)
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
    // Usa o parser para métodos que podem incluir arquivos (POST/PATCH)
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

      // Filtro por Linked Record ID do evento
      if (evento) {
        selectConfig = {
          ...selectConfig,
          filterByFormula: `SEARCH("${evento}", ARRAYJOIN({data_evento}))`,
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
        // ✅ Leitura de campos LOOKUP corrigida (usando o nome exato do Airtable):
        data_limite_recebimento: r.fields["data_limite_recebimento (from data_evento)"] || "",
        evento_id: r.fields["id_evento (from eventos)"] || "",
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

      // Prepara URL da imagem
      let imagem_cartinha = [];
      try {
        imagem_cartinha = body.imagem_cartinha
          ? JSON.parse(body.imagem_cartinha)
          : [];
      } catch {
        imagem_cartinha = [];
      }

      // Campos de evento
      const nome_evento = body.nome_evento || "";
      const evento_id = body.evento_id || ""; // ID do evento ativo (usado para Linked Record)
      
      // Prepara os campos base
      const fieldsToCreate = {
        nome_crianca: body.nome_crianca || "", // Adicionando fallback para evitar undefined
        idade: parseInt(body.idade) || null,
        sexo,
        sonho: body.sonho || "",
        imagem_cartinha,
        escola: body.escola || "",
        cidade: body.cidade || "",
        telefone_contato: body.telefone_contato || "",
        psicologa_responsavel: body.psicologa_responsavel || "",
        status,
        nome_evento,
      };

      // 💡 Adiciona Linked Record SOMENTE se evento_id for válido
      if (evento_id) {
        fieldsToCreate.data_evento = [evento_id]; // Associa ao evento ativo
      }

      // Cria novo registro
      const novo = await base(tableName).create([
        {
          fields: fieldsToCreate,
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

      // Prepara status e sexo, se vierem no body
      const sexo = sexoValido.includes((body.sexo || "").toLowerCase())
        ? body.sexo.toLowerCase()
        : undefined;
      const status = statusValido.includes((body.status || "").toLowerCase())
        ? body.status.toLowerCase()
        : undefined;
      
      // Prepara campos para atualização - SÓ ADICIONA SE O VALOR EXISTIR NO BODY
      const fieldsToUpdate = {};
      
      // 💡 CORREÇÃO CRÍTICA: Só adiciona ao fieldsToUpdate se a propriedade existe E não for vazia
      if (body.nome_crianca) fieldsToUpdate.nome_crianca = body.nome_crianca;
      if (body.idade) fieldsToUpdate.idade = parseInt(body.idade) || null;
      if (body.sonho) fieldsToUpdate.sonho = body.sonho;
      if (body.escola) fieldsToUpdate.escola = body.escola;
      if (body.cidade) fieldsToUpdate.cidade = body.cidade;
      if (body.telefone_contato) fieldsToUpdate.telefone_contato = body.telefone_contato;
      if (body.psicologa_responsavel) fieldsToUpdate.psicologa_responsavel = body.psicologa_responsavel;

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

      // ✅ Atualização de vínculo de evento
      if (body.nome_evento) fieldsToUpdate.nome_evento = body.nome_evento;
      
      // 💡 data_evento (Linked Record) só é adicionado se body.data_evento (ID) tiver valor
      if (body.data_evento) {
        fieldsToUpdate.data_evento = [body.data_evento];
      }

      // Verifica se há algo para atualizar
      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Nenhum campo válido para atualização foi fornecido." });
      }
      
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
    // Se for um erro do Airtable, retorna o status code do erro (ex: 422)
    const statusCode = e.statusCode || 500; 
    res.status(statusCode).json({ sucesso: false, mensagem: e.message, erroAirtable: e });
  }
}