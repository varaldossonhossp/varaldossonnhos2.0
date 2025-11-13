// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (VERSÃO FINAL ESTÁVEL)
// ------------------------------------------------------------
// ✅ CORREÇÃO CRÍTICA: Mapeamento INPUT_MAP para escrita (POST/PATCH)
// ✅ CORREÇÃO: Adição de `data_cadastro` na ordenação e leitura.
// ------------------------------------------------------------

import Airtable from "airtable";
import { IncomingForm } from "formidable";

export const config = {
  api: { bodyParser: false }, 
  runtime: "nodejs",
};

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// 🛑 MAPA DE CAMPOS: Chave=Nome do Input do Frontend, Valor=ID do Campo Airtable
const INPUT_MAP = {
  'nome_crianca': 'fldGr53pEoETn91NG',
  'idade': 'fld2Co6I3cEUaupqK',
  'sexo': 'fldc3IxFwc9m8riJK',
  'sonho': 'fldeTqtDT5dc5XKjV',
  'imagem_cartinha': 'fldPIoVj5uVq8sDEQ',
  'status': 'flduy2pnzF0FgneKz',
  'escola': 'fld37FvAdM9qhh5gR',
  'cidade': 'fldPLlgsGmGHfvpbD',
  'telefone_contato': 'fldl9eSto0ulvAlQF',
  'psicologa_responsavel': 'fldHA0LgGiAp6GR6B',
  'observacoes_admin': 'fld6VcuGXrYa9E3Xs',
  'data_evento': 'fldAn1ps5Y1tnJP6d', // Linked Record
};

// O campo "data_cadastro" é um campo automático do Airtable, geralmente não tem ID na API ou se for um campo "Created Time", seu nome é usado. 
const FIELD_DATA_CADASTRO = "data_cadastro"; 

// IDs das opções Single Select (Use o nome exato da opção no Airtable)
const OPCOES_SEXO = { 'menino': 'menino', 'menina': 'menina', 'outro': 'outro' }; 
const OPCOES_STATUS = { 'disponivel': 'disponivel', 'adotada': 'adotada', 'inativa': 'inativa' }; 

// ============================================================
// 🔹 Funções Auxiliares
// ============================================================
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

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
    // 🔹 GET — Lista de cartinhas 
    // ============================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      let selectConfig = {
        sort: [{ field: FIELD_DATA_CADASTRO, direction: "desc" }], 
      };

      if (evento) {
        const linkedRecordField = INPUT_MAP.data_evento || "data_evento";
        selectConfig = {
          ...selectConfig,
          filterByFormula: `SEARCH("${evento}", ARRAYJOIN({${linkedRecordField}}))`,
        };
      }

      const records = await base(tableName).select(selectConfig).all();

      const cartinha = records.map((r) => ({
        id: r.id,
        // Leitura usando o ID do campo (se definido) ou o nome
        nome_crianca: r.fields[INPUT_MAP.nome_crianca] || r.fields.nome_crianca || "", 
        idade: r.fields[INPUT_MAP.idade] || r.fields.idade || "",
        sexo: r.fields[INPUT_MAP.sexo] || r.fields.sexo || "",
        sonho: r.fields[INPUT_MAP.sonho] || r.fields.sonho || "",
        escola: r.fields[INPUT_MAP.escola] || r.fields.escola || "",
        cidade: r.fields[INPUT_MAP.cidade] || r.fields.cidade || "",
        telefone_contato: r.fields[INPUT_MAP.telefone_contato] || r.fields.telefone_contato || "",
        psicologa_responsavel: r.fields[INPUT_MAP.psicologa_responsavel] || r.fields.psicologa_responsavel || "",
        observacoes_admin: r.fields[INPUT_MAP.observacoes_admin] || r.fields.observacoes_admin || "",
        imagem_cartinha: r.fields[INPUT_MAP.imagem_cartinha] || r.fields.imagem_cartinha || [],
        status: r.fields[INPUT_MAP.status] || r.fields.status || "",
        data_cadastro: r.fields[FIELD_DATA_CADASTRO] || "", // ✅ Campo de data de cadastro
        
        // Lookups e Linked Records
        nome_evento: r.fields["nome_evento (from data_evento)"] || r.fields.nome_evento || "",
        data_evento: r.fields[INPUT_MAP.data_evento] || r.fields.data_evento || "",
        data_limite_recebimento: r.fields["data_limite_recebimento (from data_evento)"] || "",
        evento_id: r.fields["id_evento (from eventos)"] || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ============================================================
    // 🔹 POST — Criação de nova cartinha
    // ============================================================
    if (req.method === "POST") {
      const sexoKey = (body.sexo || "").toLowerCase();
      const statusKey = (body.status || "").toLowerCase();
      const evento_id = body.evento_id || body.data_evento || ""; 
      
      let imagem_cartinha = [];
      try {
        imagem_cartinha = body.imagem_cartinha ? JSON.parse(body.imagem_cartinha) : [];
      } catch {
        imagem_cartinha = [];
      }
      
      // 🛑 CORREÇÃO CRÍTICA: Mapeia o nome do input (body.nome_crianca) para o ID do campo (INPUT_MAP.nome_crianca)
      const fieldsToCreate = {
        [INPUT_MAP.nome_crianca]: body.nome_crianca || "",
        [INPUT_MAP.idade]: parseInt(body.idade) || null,
        [INPUT_MAP.sexo]: OPCOES_SEXO[sexoKey] || OPCOES_SEXO.menino,
        [INPUT_MAP.sonho]: body.sonho || "",
        [INPUT_MAP.imagem_cartinha]: imagem_cartinha,
        [INPUT_MAP.escola]: body.escola || "",
        [INPUT_MAP.cidade]: body.cidade || "",
        [INPUT_MAP.telefone_contato]: body.telefone_contato || "",
        [INPUT_MAP.psicologa_responsavel]: body.psicologa_responsavel || "",
        [INPUT_MAP.observacoes_admin]: body.observacoes_admin || "",
        [INPUT_MAP.status]: OPCOES_STATUS[statusKey] || OPCOES_STATUS.disponivel,
      };

      // Adiciona o Linked Record SÓ se o ID for válido (inicia com 'rec')
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        fieldsToCreate[INPUT_MAP.data_evento] = [evento_id]; 
      }

      const novo = await base(tableName).create([{ fields: fieldsToCreate }]);
      return res.status(200).json({ sucesso: true, novo });
    }

    // ============================================================
    // 🔹 PATCH — Atualizar cartinha existente
    // ============================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

      const sexoKey = (body.sexo || "").toLowerCase();
      const statusKey = (body.status || "").toLowerCase();
      const evento_id = body.evento_id || body.data_evento || ""; 

      const fieldsToUpdate = {};
      
      // Usa o mapa para garantir que o campo correto seja atualizado
      if (body.nome_crianca !== undefined) fieldsToUpdate[INPUT_MAP.nome_crianca] = body.nome_crianca;
      if (body.idade !== undefined) fieldsToUpdate[INPUT_MAP.idade] = parseInt(body.idade) || null;
      if (body.sonho !== undefined) fieldsToUpdate[INPUT_MAP.sonho] = body.sonho;
      if (body.escola !== undefined) fieldsToUpdate[INPUT_MAP.escola] = body.escola;
      if (body.cidade !== undefined) fieldsToUpdate[INPUT_MAP.cidade] = body.cidade;
      if (body.telefone_contato !== undefined) fieldsToUpdate[INPUT_MAP.telefone_contato] = body.telefone_contato;
      if (body.psicologa_responsavel !== undefined) fieldsToUpdate[INPUT_MAP.psicologa_responsavel] = body.psicologa_responsavel;
      if (body.observacoes_admin !== undefined) fieldsToUpdate[INPUT_MAP.observacoes_admin] = body.observacoes_admin;

      if (sexoKey in OPCOES_SEXO) fieldsToUpdate[INPUT_MAP.sexo] = OPCOES_SEXO[sexoKey];
      if (statusKey in OPCOES_STATUS) fieldsToUpdate[INPUT_MAP.status] = OPCOES_STATUS[statusKey];

      // Atualização de imagem
      if (body.imagem_cartinha) {
        try {
          const img = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(img)) fieldsToUpdate[INPUT_MAP.imagem_cartinha] = img;
        } catch { }
      }

      // Atualização de vínculo de evento (data_evento)
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        fieldsToUpdate[INPUT_MAP.data_evento] = [evento_id];
      } else if (evento_id === "") {
        fieldsToUpdate[INPUT_MAP.data_evento] = []; 
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Nenhum campo válido para atualização foi fornecido." });
      }

      const atualizado = await base(tableName).update([{ id, fields: fieldsToUpdate }]);
      return res.status(200).json({ sucesso: true, atualizado });
    }
    
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

      await base(tableName).destroy([id]);
      return res.status(200).json({ sucesso: true, mensagem: "Cartinha excluída!" });
    }
    
    res.status(405).json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}