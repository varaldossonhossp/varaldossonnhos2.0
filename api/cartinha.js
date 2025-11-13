// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (VERSÃO FINAL E ROBUSTA)
// ------------------------------------------------------------
// ✅ Status: 200 OK para POST, PATCH, GET.
// ------------------------------------------------------------
// Requisitos: Necessita das variáveis de ambiente AIRTABLE_API_KEY e AIRTABLE_BASE_ID.
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable";

// ============================================================
// ⚙️ CONFIGURAÇÃO ESSENCIAL PARA FORM-DATA NO VERCEL
// ============================================================
export const config = {
  api: { bodyParser: false }, // ❗ Obrigatório para Formidable (permite o parse manual)
  runtime: "nodejs",
};

// ============================================================
// 🔹 Constantes Airtable (Baseado na sua documentação)
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// Mapeamento dos campos: Nome (para uso interno) -> ID do campo Airtable
const CAMPOS = {
  NOME_CRIANCA: 'nome_crianca',
  IDADE: 'idade',
  SEXO: 'sexo',
  SONHO: 'sonho',
  IMAGEM_CARTINHA: 'imagem_cartinha',
  STATUS: 'status',
  ESCOLA: 'escola',
  CIDADE: 'cidade',
  TELEFONE: 'telefone_contato',
  PSICOLOGA: 'psicologa_responsavel',
  OBS_ADMIN: 'observacoes_admin',
  EVENTOS_LINKED: 'data_evento', // Linked Record
  // Lookups (Nomes completos do campo para leitura)
  LOOKUP_NOME_EVENTO: "nome_evento (from data_evento)", 
  LOOKUP_DATA_LIMITE: "data_limite_recebimento (from data_evento)",
  LOOKUP_DATA_EVENTO: "data_evento (from data_evento)",
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
      // Transforma os arrays de campos (retorno do formidable no Vercel) em strings simples
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
    // Usa o parser para ler Form Data (inclui campos de texto e a imagem)
    if (req.method === "POST" || req.method === "PATCH") {
      const parsed = await parseForm(req);
      body = parsed.fields;
    }

    // ============================================================
    // 🔹 GET — Lista de cartinhas (Lê corretamente Lookups)
    // ============================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      const records = await base(tableName).select({
        sort: [{ field: "data_cadastro", direction: "desc" }],
        ...(evento && {
          filterByFormula: `SEARCH("${evento}", ARRAYJOIN({${CAMPOS.EVENTOS_LINKED}}))`,
        }),
      }).all();

      const cartinha = records.map((r) => ({
        id: r.id,
        nome_crianca: r.fields[CAMPOS.NOME_CRIANCA] || "",
        idade: r.fields[CAMPOS.IDADE] || "",
        sexo: r.fields[CAMPOS.SEXO] || "",
        sonho: r.fields[CAMPOS.SONHO] || "",
        escola: r.fields[CAMPOS.ESCOLA] || "",
        cidade: r.fields[CAMPOS.CIDADE] || "",
        telefone_contato: r.fields[CAMPOS.TELEFONE] || "",
        psicologa_responsavel: r.fields[CAMPOS.PSICOLOGA] || "",
        observacoes_admin: r.fields[CAMPOS.OBS_ADMIN] || "",
        imagem_cartinha: r.fields[CAMPOS.IMAGEM_CARTINHA] || [],
        status: r.fields[CAMPOS.STATUS] || "",
        
        // Leitura de Lookups e Linked Record
        nome_evento: r.fields[CAMPOS.LOOKUP_NOME_EVENTO] || "",
        data_evento: r.fields[CAMPOS.EVENTOS_LINKED] || [], 
        data_limite_recebimento: r.fields[CAMPOS.LOOKUP_DATA_LIMITE] || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ============================================================
    // 🔹 POST — Criação de nova cartinha (Usa IDs de Opção e ignora Lookups/Fórmulas)
    // ============================================================
    if (req.method === "POST") {
      const evento_id = body.data_evento || "";
      let imagem_cartinha = [];
      try {
        imagem_cartinha = body.imagem_cartinha ? JSON.parse(body.imagem_cartinha) : [];
      } catch (e) {
        imagem_cartinha = [];
      }
      
      const sexoKey = (body.sexo || "").toLowerCase();
      const statusKey = (body.status || "").toLowerCase();
      
      const fieldsToCreate = {
        [CAMPOS.NOME_CRIANCA]: body.nome_crianca || "",
        [CAMPOS.IDADE]: parseInt(body.idade) || null,
        [CAMPOS.SEXO]: OPCOES_SEXO[sexoKey] || OPCOES_SEXO['menino'], 
        [CAMPOS.SONHO]: body.sonho || "",
        [CAMPOS.IMAGEM_CARTINHA]: imagem_cartinha,
        [CAMPOS.ESCOLA]: body.escola || "",
        [CAMPOS.CIDADE]: body.cidade || "",
        [CAMPOS.TELEFONE]: body.telefone_contato || "",
        [CAMPOS.PSICOLOGA]: body.psicologa_responsavel || "",
        [CAMPOS.OBS_ADMIN]: body.observacoes_admin || "",
        [CAMPOS.STATUS]: OPCOES_STATUS[statusKey] || OPCOES_STATUS['disponivel'],
        // data_cadastro, irmaos, idade_irmaos, primeiro_nome, adocoes, usuario são omitidos (Fórmulas, Lookups ou não essenciais)
      };

      // Adiciona o Linked Record (data_evento) SÓ se o ID for válido
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        fieldsToCreate[CAMPOS.EVENTOS_LINKED] = [evento_id];
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
      if (body.nome_crianca) fieldsToUpdate[CAMPOS.NOME_CRIANCA] = body.nome_crianca;
      if (body.idade) fieldsToUpdate[CAMPOS.IDADE] = parseInt(body.idade) || null;
      if (body.sonho) fieldsToUpdate[CAMPOS.SONHO] = body.sonho;
      if (body.escola) fieldsToUpdate[CAMPOS.ESCOLA] = body.escola;
      if (body.cidade) fieldsToUpdate[CAMPOS.CIDADE] = body.cidade;
      if (body.telefone_contato) fieldsToUpdate[CAMPOS.TELEFONE] = body.telefone_contato;
      if (body.psicologa_responsavel) fieldsToUpdate[CAMPOS.PSICOLOGA] = body.psicologa_responsavel;
      if (body.observacoes_admin) fieldsToUpdate[CAMPOS.OBS_ADMIN] = body.observacoes_admin;
      
      // Status e Sexo (devem ser mapeados para o ID da opção)
      if (body.sexo) {
        const sexoKey = (body.sexo || "").toLowerCase();
        fieldsToUpdate[CAMPOS.SEXO] = OPCOES_SEXO[sexoKey];
      }
      if (body.status) {
        const statusKey = (body.status || "").toLowerCase();
        fieldsToUpdate[CAMPOS.STATUS] = OPCOES_STATUS[statusKey];
      }

      // Imagem
      if (body.imagem_cartinha) {
        try {
          fieldsToUpdate[CAMPOS.IMAGEM_CARTINHA] = JSON.parse(body.imagem_cartinha);
        } catch (e) {
          console.error("Erro ao parsear imagem_cartinha no PATCH", e);
        }
      }

      // Atualização de vínculo de evento (Pode ser atualizado ou desvinculado)
      const evento_id = body.data_evento;
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        fieldsToUpdate[CAMPOS.EVENTOS_LINKED] = [evento_id];
      } else if (body.data_evento === "") {
        fieldsToUpdate[CAMPOS.EVENTOS_LINKED] = []; 
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Nenhum campo válido para atualização foi fornecido." });
      }
      
      const atualizado = await base(tableName).update([{ id, fields: fieldsToUpdate }]);
      return res.status(200).json({ sucesso: true, atualizado });
    }
    
    // ❌ Método não suportado
    res.status(405).json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    const statusCode = e.statusCode || 500; 
    res.status(statusCode).json({ sucesso: false, mensagem: e.message, erroAirtable: e });
  }
}