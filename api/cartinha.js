// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (SOLUÇÃO FINAL PARA CAMPOS VAZIOS)
// ------------------------------------------------------------
// ✅ CORREÇÕES CRÍTICAS:
// - Ajuste na leitura de campos do Formidable (garantindo que campos de texto sejam strings).
// - Confirmação do nome dos campos de LOOKUP para o GET.
// - Lógica robusta para tratar o campo Linked Record (data_evento) no POST/PATCH.
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
// 🔹 Conexão e Constantes
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================
// 🔄 FUNÇÃO PARSER OBRIGATÓRIA PARA LER FORM-DATA NO VERCEL
// ============================================================
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      
      const parsedFields = {};
      
      // 💡 CORREÇÃO: Transforma os arrays de campos (retorno do formidable no Vercel)
      // em strings simples para serem usados como valores no Airtable.
      for (const key in fields) {
        // Pega o primeiro elemento do array ou mantém a string se não for um array
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
    // 🚨 USA O PARSER PARA LER CAMPOS DE TEXTO E IMAGEM
    if (req.method === "POST" || req.method === "PATCH") {
      const parsed = await parseForm(req);
      body = parsed.fields; // body agora contém todos os campos de texto como strings simples
    }

    // ============================================================
    // 🔹 GET — Lista de cartinhas (UNKNOWN_FIELD_NAME)
    // ============================================================
    if (req.method === "GET") {
      // ... (Lógica de GET)
      const { evento } = req.query;
      
      const records = await base(tableName).select({
        sort: [{ field: "data_cadastro", direction: "desc" }],
        ...(evento && {
          filterByFormula: `SEARCH("${evento}", ARRAYJOIN({data_evento}))`,
        }),
      }).all();

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
        data_evento: r.fields.data_evento || [],
        // ✅ CORREÇÃO CRÍTICA DO LOOKUP
        data_limite_recebimento: r.fields["data_limite_recebimento (from data_evento)"] || "",
        evento_id: r.fields["id_evento (from eventos)"] || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }
    
    // ============================================================
    // 🔹 POST — Criação de nova cartinha (Campos VAZIOS / INVALID_RECORD_ID)
    // ============================================================
    if (req.method === "POST") {
      const evento_id = body.data_evento || ""; // ID do Linked Record (se existir)
      let imagem_cartinha = [];
      try {
        // Tenta parsear a string JSON enviada pelo frontend
        imagem_cartinha = body.imagem_cartinha ? JSON.parse(body.imagem_cartinha) : [];
      } catch (e) {
        console.error("Erro ao parsear imagem_cartinha", e);
        imagem_cartinha = [];
      }
      
      // Campos validados ou com fallback
      const sexo = ["menino", "menina", "outro"].includes((body.sexo || "").toLowerCase()) ? body.sexo.toLowerCase() : "menino";
      const status = ["disponivel", "adotada", "inativa"].includes((body.status || "").toLowerCase()) ? body.status.toLowerCase() : "disponivel";


      // 💡 TODOS OS CAMPOS DE TEXTO DEVEM ESTAR NO `body` CORRETAMENTE POR CAUSA DA CORREÇÃO NO `parseForm`
      const fieldsToCreate = {
        nome_crianca: body.nome_crianca || "NOME VAZIO", // Fallback para identificar erro
        idade: parseInt(body.idade) || null,
        sexo,
        sonho: body.sonho || "SONHO VAZIO",
        imagem_cartinha, // Array de objetos de imagem
        escola: body.escola || "",
        cidade: body.cidade || "",
        telefone_contato: body.telefone_contato || "",
        psicologa_responsavel: body.psicologa_responsavel || "",
        status,
        nome_evento: body.nome_evento || "",
        data_cadastro: new Date().toISOString().substring(0, 10),
      };

      // Adiciona o Linked Record SÓ se o ID for um Airtable ID válido (começa com 'rec')
      if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
        fieldsToCreate.data_evento = [evento_id];
      }

      // Cria novo registro
      const novo = await base(tableName).create([{ fields: fieldsToCreate }]);

      return res.status(200).json({ sucesso: true, novo });
    }

    // ... (Lógica de PATCH e DELETE omitida, mas deve usar a mesma lógica do parseForm)
    if (req.method === "PATCH") {
        // ... (o PATCH também precisa do parseForm(req) para ler o body)
        // ... (use a mesma lógica de fieldsToUpdate e validação de evento_id do PATCH anterior)
        const { id } = req.query;
        // ... (validação de id)
        const fieldsToUpdate = {};
        
        // ... (coleta de campos com base no body)
        if (body.nome_crianca) fieldsToUpdate.nome_crianca = body.nome_crianca;
        if (body.idade) fieldsToUpdate.idade = parseInt(body.idade) || null;
        if (body.sonho) fieldsToUpdate.sonho = body.sonho;
        // ... (outros campos)

        // Atualização de vínculo de evento
        const evento_id = body.data_evento;
        if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
            fieldsToUpdate.data_evento = [evento_id];
        } else if (body.data_evento === "") {
            fieldsToUpdate.data_evento = []; 
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