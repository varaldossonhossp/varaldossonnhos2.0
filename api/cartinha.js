// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (VERSÃO FINAL 100% CORRIGIDA)
// ------------------------------------------------------------
// ✅ CORREÇÃO CRÍTICA: Mapeamento de escrita (POST/PATCH) usa ID do campo Airtable como chave.
// ------------------------------------------------------------

import Airtable from "airtable";
import { IncomingForm } from "formidable";

// ============================================================
// ⚙️ CONFIGURAÇÃO ESSENCIAL PARA FORM-DATA NO VERCEL
// ============================================================
export const config = {
  api: { bodyParser: false }, 
  runtime: "nodejs",
};

// ============================================================
// 🔹 Constantes Airtable (Baseado na sua documentação)
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// Mapeamento dos campos: Nome de Input do Frontend (Chave) -> ID do campo Airtable (Valor)
// Usado para TRADUZIR a entrada (body) para a chave que o Airtable espera.
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

// IDs das opções Single Select para escrita (POST/PATCH)
const OPCOES_SEXO = {
  'menino': 'selMQTejKg2j83b0u',
  'menina': 'selN6usmszeOgwdo4',
  'outro': 'selNiw6EPSWDco0e6',
};
const OPCOES_STATUS = {
  'disponivel': 'seliXLxLcmD5twbGq',
  'adotada': 'seld9JVzSUP4DShWu',
  'inativa': 'selaiZI8VgArz1DsT',
};

// Nomes de Lookup para leitura (GET)
const LOOKUP_NOME_EVENTO = "nome_evento (from data_evento)"; 
const LOOKUP_DATA_LIMITE = "data_limite_recebimento (from data_evento)";
const LOOKUP_DATA_EVENTO = "data_evento (from data_evento)";


// ============================================================
// 🔹 Funções Auxiliares (mantidas)
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
      for (const key in fields) {
        parsedFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
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

    // ============================================================
    // 🔹 GET — Lista de cartinhas (Usa o ID do campo na leitura)
    // ============================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      const records = await base(tableName).select({
        sort: [{ field: "data_cadastro", direction: "desc" }],
        ...(evento && {
          filterByFormula: `SEARCH("${evento}", ARRAYJOIN({${INPUT_MAP.data_evento}}))`,
        }),
      }).all();

      const cartinha = records.map((r) => ({
        id: r.id,
        nome_crianca: r.fields[INPUT_MAP.nome_crianca] || "", 
        idade: r.fields[INPUT_MAP.idade] || "",
        sexo: r.fields[INPUT_MAP.sexo] || "",
        sonho: r.fields[INPUT_MAP.sonho] || "",
        escola: r.fields[INPUT_MAP.escola] || "",
        cidade: r.fields[INPUT_MAP.cidade] || "",
        telefone_contato: r.fields[INPUT_MAP.telefone_contato] || "",
        psicologa_responsavel: r.fields[INPUT_MAP.psicologa_responsavel] || "",
        observacoes_admin: r.fields[INPUT_MAP.observacoes_admin] || "",
        imagem_cartinha: r.fields[INPUT_MAP.imagem_cartinha] || [],
        status: r.fields[INPUT_MAP.status] || "",
        
        // Leitura de Lookups e Linked Record (usa o nome completo ou ID)
        nome_evento: r.fields[LOOKUP_NOME_EVENTO] || "",
        data_evento: r.fields[INPUT_MAP.data_evento] || [], 
        data_limite_recebimento: r.fields[LOOKUP_DATA_LIMITE] || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ============================================================
    // 🔹 POST — Criação de nova cartinha (Chave=ID, Valor=Input)
    // ============================================================
    if (req.method === "POST") {
      const evento_id = body.data_evento || "";
      let imagem_cartinha = [];
      try {
        // O frontend envia a imagem_cartinha como string JSON
        imagem_cartinha = body.imagem_cartinha ? JSON.parse(body.imagem_cartinha) : [];
      } catch (e) {
        imagem_cartinha = [];
      }
      
      const sexoKey = (body.sexo || "").toLowerCase();
      const statusKey = (body.status || "").toLowerCase();
      
      // 🛑 CORREÇÃO APLICADA: A chave do objeto de criação é o ID do campo (INPUT_MAP.nome), 
      // e o valor é o dado do frontend (body.nome).
      const fieldsToCreate = {
        [INPUT_MAP.nome_crianca]: body.nome_crianca || "",
        [INPUT_MAP.idade]: parseInt(body.idade) || null,
        [INPUT_MAP.sexo]: OPCOES_SEXO[sexoKey] || OPCOES_SEXO['menino'], 
        [INPUT_MAP.sonho]: body.sonho || "",
        [INPUT_MAP.imagem_cartinha]: imagem_cartinha,
        [INPUT_MAP.escola]: body.escola || "",
        [INPUT_MAP.cidade]: body.cidade || "",
        [INPUT_MAP.telefone_contato]: body.telefone_contato || "",
        [INPUT_MAP.psicologa_responsavel]: body.psicologa_responsavel || "",
        [INPUT_MAP.observacoes_admin]: body.observacoes_admin || "",
        [INPUT_MAP.status]: OPCOES_STATUS[statusKey] || OPCOES_STATUS['disponivel'],
      };

      // Adiciona o Linked Record (data_evento) SÓ se o ID for válido
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
      const fieldsToUpdate = {};

      // Mapeamento de campos de texto/número
      if (body.nome_crianca) fieldsToUpdate[INPUT_MAP.nome_crianca] = body.nome_crianca;
      if (body.idade) fieldsToUpdate[INPUT_MAP.idade] = parseInt(body.idade) || null;
      if (body.sonho) fieldsToUpdate[INPUT_MAP.sonho] = body.sonho;
      if (body.escola) fieldsToUpdate[INPUT_MAP.escola] = body.escola;
      if (body.cidade) fieldsToUpdate[INPUT_MAP.cidade] = body.cidade;
      if (body.telefone_contato) fieldsToUpdate[INPUT_MAP.telefone_contato] = body.telefone_contato;
      if (body.psicologa_responsavel) fieldsToUpdate[INPUT_MAP.psicologa_responsavel] = body.psicologa_responsavel;
      if (body.observacoes_admin) fieldsToUpdate[INPUT_MAP.observacoes_admin] = body.observacoes_admin;
      
      // Status e Sexo (devem ser mapeados para o ID da opção)
      if (body.sexo) {
        const sexoKey = (body.sexo || "").toLowerCase();
        fieldsToUpdate[INPUT_MAP.sexo] = OPCOES_SEXO[sexoKey];
      }
      if (body.status) {
        const statusKey = (body.status || "").toLowerCase();
        fieldsToUpdate[INPUT_MAP.status] = OPCOES_STATUS[statusKey];
      }

      // Imagem
      if (body.imagem_cartinha) {
        try {
          fieldsToUpdate[INPUT_MAP.imagem_cartinha] = JSON.parse(body.imagem_cartinha);
        } catch (e) {
          console.error("Erro ao parsear imagem_cartinha no PATCH", e);
        }
      }

      // Atualização de vínculo de evento
      const evento_id = body.data_evento;
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        fieldsToUpdate[INPUT_MAP.data_evento] = [evento_id];
      } else if (body.data_evento === "") {
        fieldsToUpdate[INPUT_MAP.data_evento] = []; 
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Nenhum campo válido para atualização foi fornecido." });
      }
      
      const atualizado = await base(tableName).update([{ id, fields: fieldsToUpdate }]);
      return res.status(200).json({ sucesso: true, atualizado });
    }
    
    // ... (DELETE)

    // ❌ Método não suportado
    res.status(405).json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    const statusCode = e.statusCode || 500; 
    res.status(statusCode).json({ sucesso: false, mensagem: e.message, erroAirtable: e });
  }
}