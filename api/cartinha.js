// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (versão final revisada)
// ------------------------------------------------------------
// • Busca todas as cartinhas disponíveis no Airtable.
// • Retorna somente status = 'disponivel'.
// • Inclui sempre o campo id_cartinha (autonumber) e o recordId.
// • ADICIONADO: Suporte para upload de arquivos com 'formidable'.
// • POST/PATCH: Recebe o arquivo e o envia como Anexo para o Airtable.
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable"; // ⬅️ NOVO: Importa o formidable
import fs from "fs"; // ⬅️ NOVO: Módulo nativo do Node.js para manipulação de arquivos

// ============================================================
// ⚠️ CONFIG ESSENCIAL PARA UPLOAD DE ARQUIVOS NO VERVEL
// ============================================================
export const config = {
  api: {
    bodyParser: false, // ⬅️ ESSENCIAL: Desativa o parser de body padrão
  },
  runtime: "nodejs",
};

// ============================================================
// 🔹 Conexão base
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
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
// 🔄 Função para fazer o parse do Form Data
// ============================================================
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    
    // Altera o nome do campo de arquivo que o front envia para 'imagem_cartinha_file'
    // Isso é útil para distinguí-lo dos campos de texto (fields)
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      
      // Converte fields de array de strings para objeto simples (formidable retorna array)
      const parsedFields = {};
      for (const key in fields) {
        parsedFields[key] = fields[key][0]; 
      }
      
      resolve({ fields: parsedFields, files });
    });
  });
}

// ============================================================
// 🔹 Handler principal
// ============================================================
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // -----------------------------------------------------------
    // Processamento de arquivos para POST/PATCH
    // -----------------------------------------------------------
    let body = req.body; // Inicializa body
    let files = {};
    
    // Se for POST ou PATCH, faz o parse do FormData para obter campos e arquivos
    if (req.method === "POST" || req.method === "PATCH") {
      const parsedData = await parseForm(req);
      body = parsedData.fields;
      files = parsedData.files;
    }

    // ============================================================
    // GET — Listar cartinhas (Sem Alteração)
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

      return res
        .status(200)
        .json({ sucesso: true, total: cartinha.length, cartinha });
    }

    // ============================================================
    // POST — Criar nova cartinha
    // ============================================================
    if (req.method === "POST") {
      const statusValido = ["disponivel", "adotada"];
      const status = statusValido.includes(body.status) ? body.status : "disponivel";
      
      // ⬅️ NOVO: Lógica para anexar o arquivo (se existir)
      const anexoAirtable = [];
      const imagemFile = files.imagem_cartinha ? files.imagem_cartinha[0] : null;

      if (imagemFile) {
        anexoAirtable.push({
          filename: imagemFile.originalFilename || "cartinha.png",
          type: imagemFile.mimetype || "image/png",
          // Usa o caminho temporário do arquivo para criar um stream.
          file: fs.createReadStream(imagemFile.filepath), 
        });
      }

      const novo = await base(tableName).create([
        {
          fields: {
            nome_crianca: body.nome_crianca,
            idade: parseInt(body.idade) || null, // Converte idade para número
            sexo: body.sexo,
            sonho: body.sonho,
            // ⬅️ ALTERADO: Usa o anexo processado
            imagem_cartinha: anexoAirtable, 
            escola: body.escola,
            cidade: body.cidade,
            psicologa_responsavel: body.psicologa_responsavel,
            telefone_contato: body.telefone_contato,
            status: body.status || "disponivel",
            ponto_coleta: body.ponto_coleta ? [body.ponto_coleta] : undefined,
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

      const statusValido = ["disponivel", "adotada"];
      const status = statusValido.includes(body.status) ? body.status : undefined;

      // Montar campos para atualizar
      const fieldsToUpdate = {
        nome_crianca: body.nome_crianca,
        idade: parseInt(body.idade) || null, // Converte idade para número
        sexo: body.sexo,
        sonho: body.sonho,
        escola: body.escola,
        cidade: body.cidade,
        psicologa_responsavel: body.psicologa_responsavel,
        telefone_contato: body.telefone_contato,
      };

      // ⬅️ NOVO: Lógica para anexar o arquivo (apenas se um NOVO arquivo for enviado)
      const imagemFile = files.imagem_cartinha ? files.imagem_cartinha[0] : null;

      if (imagemFile) {
        // Se um novo arquivo foi enviado, ele substitui o anterior.
        fieldsToUpdate.imagem_cartinha = [
          {
            filename: imagemFile.originalFilename || "cartinha.png",
            type: imagemFile.mimetype || "image/png",
            file: fs.createReadStream(imagemFile.filepath),
          },
        ];
      }
      
      // O campo 'imagem_cartinha' SÓ é incluído no PATCH se um novo arquivo for enviado.
      // Caso contrário, ele é omitido, preservando o anexo existente no Airtable.
      
      if (body.ponto_coleta !== undefined) {
        fieldsToUpdate.ponto_coleta = body.ponto_coleta ? [body.ponto_coleta] : undefined;
      }

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
    // DELETE — Excluir cartinha (Sem Alteração)
    // ============================================================
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório" });

      await base(tableName).destroy([id]);
      return res.status(200).json({ sucesso: true, mensagem: "Cartinha excluída!" });
    }

    // ============================================================
    // Método não suportado (Sem Alteração)
    // ============================================================
    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]);
    return res
      .status(405)
      .json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    // Erro ao tentar ler o campo `idade` como número:
    let errorMessage = e.message;
    if (errorMessage.includes("body.idade")) {
        errorMessage = "Erro de validação: 'Idade' deve ser um número válido.";
    }

    res.status(500).json({ sucesso: false, mensagem: errorMessage });
  }
}