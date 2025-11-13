// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (VERSÃO FINAL ROBUSTA)
// ------------------------------------------------------------
// ✅ CORREÇÃO CRÍTICA V3: Checagem de segurança contra 'UNKNOWN_FIELD_NAME: "undefined"'
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
// ESTES SÃO OS IDs EXATOS DO SEU AIRTABLE.
const INPUT_MAP = {
  'id_cartinha': 'fldBfJYnZLdrn7KlM',
  'nome_crianca': 'fldGr53pEoETn91NG',
  'idade': 'fld2Co6I3cEUaupqK',
  'sexo': 'fldc3IxFwc9m8riJK',
  'irmaos': 'fld3HFOvP98Qnr8bX',
  'sonho': 'fldeTqtDT5dc5XKjV',
  'imagem_cartinha': 'fldPIoVj5uVq8sDEQ',
  'status': 'flduy2pnzF0FgneKz',
  'escola': 'fld37FvAdM9qhh5gR',
  'cidade': 'fldPLlgsGmGHfvpbD',
  'telefone_contato': 'fldl9eSto0ulvAlQF',
  'psicologa_responsavel': 'fldHA0LgGiAp6GR6B',
  'observacoes_admin': 'fld6VcuGXrYa9E3Xs',
  'data_evento': 'fldAn1ps5Y1tnJP6d', // Linked Record
  'data_cadastro': 'fldp6UNiNXs1yiCQh', // Campo de sistema para ordenação
  'idade_irmaos': 'fldlG1tqUAXtzKIf8',
};

// IDs das opções Single Select (CORRIGIDOS)
const OPCOES_SEXO = { 
  'menino': 'selMQTejKg2j83b0u', 
  'menina': 'selN6usmszeOgwdo4', 
  'outro': 'selNiw6EPSWDco0e6' 
}; 
const OPCOES_STATUS = { 
  'disponivel': 'seliXLxLcmD5twbGq', 
  'adotada': 'seld9JVzSUP4DShWu', 
  'inativa': 'selaiZI8VgArz1DsT' 
}; 

// Define a chave para ordenação/filtro
const FIELD_DATA_CADASTRO = INPUT_MAP.data_cadastro;


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
    // 🔹 GET — Lista de cartinhas (Lógica de leitura e filtro mantida)
    // ============================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      let selectConfig = {
        sort: [{ field: FIELD_DATA_CADASTRO, direction: "desc" }], 
      };

      if (evento) {
        selectConfig = {
          ...selectConfig,
          filterByFormula: `SEARCH("${evento}", ARRAYJOIN({${INPUT_MAP.data_evento}}))`,
        };
      }

      const records = await base(tableName).select(selectConfig).all();

      const cartinha = records.map((r) => ({
        id: r.id,
        // Mapeamento de Leitura (usando field names, mas os IDs são válidos no INPUT_MAP)
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
        data_cadastro: r.fields[FIELD_DATA_CADASTRO] || r.fields.data_cadastro || "", 
        
        // Lookups
        nome_evento: r.fields["nome_evento (from data_evento)"] || "",
        data_evento: r.fields["data_evento (from data_evento)"] || "",
        data_limite_recebimento: r.fields["data_limite_recebimento (from data_evento)"] || "",
        evento_id: r.fields[INPUT_MAP.data_evento]?.[0] || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ============================================================
    // 🔹 POST — Criação de nova cartinha (Com checagem de ID)
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
      
      // 🛑 Adiciona checagem de ID para evitar 'undefined' no nome do campo
      const fieldsToCreate = {};

      const fieldsMap = [
        { key: 'nome_crianca', value: body.nome_crianca || "" },
        { key: 'idade', value: parseInt(body.idade) || null },
        { key: 'sexo', value: OPCOES_SEXO[sexoKey] || OPCOES_SEXO.menino },
        { key: 'sonho', value: body.sonho || "" },
        { key: 'imagem_cartinha', value: imagem_cartinha },
        { key: 'escola', value: body.escola || "" },
        { key: 'cidade', value: body.cidade || "" },
        { key: 'telefone_contato', value: body.telefone_contato || "" },
        { key: 'psicologa_responsavel', value: body.psicologa_responsavel || "" },
        { key: 'observacoes_admin', value: body.observacoes_admin || "" },
        { key: 'status', value: OPCOES_STATUS[statusKey] || OPCOES_STATUS.disponivel },
        { key: 'irmaos', value: parseInt(body.irmaos) || null },
        { key: 'idade_irmaos', value: body.idade_irmaos || "" },
      ];

      fieldsMap.forEach(({ key, value }) => {
          const fieldId = INPUT_MAP[key];
          if (fieldId) { // Só adiciona se o ID do campo for encontrado no INPUT_MAP
              fieldsToCreate[fieldId] = value;
          }
      });
      
      // Adiciona o Linked Record SÓ se o ID for válido (inicia com 'rec')
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        const eventFieldId = INPUT_MAP.data_evento;
        if (eventFieldId) fieldsToCreate[eventFieldId] = [evento_id];
      }

      const novo = await base(tableName).create([{ fields: fieldsToCreate }]);
      return res.status(200).json({ sucesso: true, novo });
    }

    // ============================================================
    // 🔹 PATCH — Atualizar cartinha existente (Com checagem de ID)
    // ============================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

      const sexoKey = (body.sexo || "").toLowerCase();
      const statusKey = (body.status || "").toLowerCase();
      const evento_id = body.evento_id || body.data_evento || ""; 

      const fieldsToUpdate = {};
      
      // Mapeamento com checagem de ID e valor presente
      const updateFieldsMap = [
        { key: 'nome_crianca', value: body.nome_crianca },
        { key: 'idade', value: parseInt(body.idade) || null },
        { key: 'sonho', value: body.sonho },
        { key: 'escola', value: body.escola },
        { key: 'cidade', value: body.cidade },
        { key: 'telefone_contato', value: body.telefone_contato },
        { key: 'psicologa_responsavel', value: body.psicologa_responsavel },
        { key: 'observacoes_admin', value: body.observacoes_admin },
        { key: 'irmaos', value: parseInt(body.irmaos) || null },
        { key: 'idade_irmaos', value: body.idade_irmaos },
      ];

      updateFieldsMap.forEach(({ key, value }) => {
          if (value !== undefined) {
              const fieldId = INPUT_MAP[key];
              if (fieldId) fieldsToUpdate[fieldId] = value;
          }
      });

      // Single Selects
      if (sexoKey in OPCOES_SEXO) {
          const fieldId = INPUT_MAP.sexo;
          if(fieldId) fieldsToUpdate[fieldId] = OPCOES_SEXO[sexoKey];
      }
      if (statusKey in OPCOES_STATUS) {
          const fieldId = INPUT_MAP.status;
          if(fieldId) fieldsToUpdate[fieldId] = OPCOES_STATUS[statusKey];
      }


      // Atualização de imagem
      if (body.imagem_cartinha) {
        try {
          const img = JSON.parse(body.imagem_cartinha);
          const fieldId = INPUT_MAP.imagem_cartinha;
          if (Array.isArray(img) && fieldId) fieldsToUpdate[fieldId] = img;
        } catch { }
      }

      // Atualização de vínculo de evento (data_evento)
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        const fieldId = INPUT_MAP.data_evento;
        if(fieldId) fieldsToUpdate[fieldId] = [evento_id];
      } else if (evento_id === "") {
        const fieldId = INPUT_MAP.data_evento;
        if(fieldId) fieldsToUpdate[fieldId] = []; 
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Nenhum campo válido para atualização foi fornecido." });
      }

      const atualizado = await base(tableName).update([{ id, fields: fieldsToUpdate }]);
      return res.status(200).json({ sucesso: true, atualizado });
    }
    
    // ... (Restante do DELETE e error handlers)
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