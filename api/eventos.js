// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js (COM CORREÇÃO 405)
// ============================================================

import Airtable from "airtable";
import formidable from "formidable";

// ⚠️ CORREÇÃO PARA O ERRO 405 (MÉTODO NÃO PERMITIDO) COM FORM-DATA/UPLOAD:
export const config = { 
    api: {
        bodyParser: false, 
    },
    runtime: "nodejs" 
};

const ok = (res, data) => res.status(200).json(data);
const err = (res, code, msg, detalhe) =>
  res.status(code).json({ sucesso: false, mensagem: msg, detalhe });

function getAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_EVENTOS_TABLE || "eventos";
  if (!apiKey || !baseId)
    throw new Error("Credenciais Airtable ausentes. Verifique as variáveis de ambiente.");
  const base = new Airtable({ apiKey }).base(baseId);
  return { base, table };
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      
      // fields e files são retornados como arrays de string, convertemos para o formato simples:
      const simplifiedFields = {};
      for (const key in fields) {
        simplifiedFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      }
      
      resolve({ fields: simplifiedFields, files });
    });
  });
}

function pick(val1, val2) {
    return val1 ?? val2;
}

function toIntSafe(value) {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
}

/**
 * Mapeia o registro do Airtable para o formato JS.
 */
// ============================================================
// 💡 mapEvento CORRIGIDO
// ============================================================
function mapEvento(rec) {
  const f = rec.fields;
  const imagem = f.imagem ?? [];
  const statusRaw = (f.status_evento || "").toString().toLowerCase(); 
  return {
    id: rec.id,
    nome_evento: f.nome_evento ?? "",
    descricao: f.descricao ?? "",
    local_evento: f.local_evento ?? "",
    data_evento: f.data_evento ?? null,
    data_limite_recebimento: f.data_limite_recebimento ?? null,
    data_realizacao_evento: f.data_realizacao_evento ?? null,
    status_evento: statusRaw,
    destacar_na_homepage: !!f.destacar_na_homepage,
    imagem: imagem,
    cartinhas_total: toIntSafe(pick(f.cartinhas_total, f.cartinhas)),
    adocoes_total: toIntSafe(pick(f.adocoes_total, f.adocoes)),
  };
}

/**
 * Mapeia os dados recebidos do formulário (FormData) para o formato do Airtable.
 */
function mapToAirtableFields(formData) {
  const fields = {};
  
  if (formData.nome_evento !== undefined) fields.nome_evento = formData.nome_evento;
  if (formData.descricao !== undefined) fields.descricao = formData.descricao;
  if (formData.local_evento !== undefined) fields.local_evento = formData.local_evento;
  if (formData.data_evento !== undefined) fields.data_evento = formData.data_evento;
  if (formData.data_limite_recebimento !== undefined) fields.data_limite_recebimento = formData.data_limite_recebimento;
  if (formData.data_realizacao_evento !== undefined) fields.data_realizacao_evento = formData.data_realizacao_evento;
  if (formData.status_evento !== undefined) fields.status_evento = formData.status_evento;

  if (formData.destacar_na_homepage !== undefined) {
    fields.destacar_na_homepage = formData.destacar_na_homepage === "true";
  }

  // Imagem: O frontend envia um JSON string com a URL do Cloudinary
  if (formData.imagem) {
    try {
      fields.imagem = JSON.parse(formData.imagem); 
    } catch (e) {
      console.error("Erro ao parsear imagem JSON:", e);
    }
  }

  return fields;
}


// ------------------------------------------------------------
// 🚀 Handler Principal
// ------------------------------------------------------------
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).end();

    try {
        const { base, table } = getAirtable();
        const { id } = req.query;

        // ------------------------------------------------------------
        // ⚠️ MUDANÇA CRÍTICA: Processar o corpo da requisição POST/PATCH
        // ------------------------------------------------------------
        let bodyFields = {};
        if (req.method === "POST" || req.method === "PATCH") {
            // ✅ AQUI CHAMAMOS parseForm(req) para obter os campos do FormData
            const { fields } = await parseForm(req);
            bodyFields = fields;
        }

        // ------------------------------------------------------------
        // 1. BUSCA POR ID (GET)
        // ------------------------------------------------------------
        if (req.method === "GET" && id) {
            try {
                const registro = await base(table).find(id);
                const evento = mapEvento(registro); 
                return ok(res, { sucesso: true, evento });
            } catch (e) {
                return err(res, 404, "Evento não encontrado.", e.message);
            }
        }
        
        // ------------------------------------------------------------
        // 2. LISTAGEM (GET) - Onde o frontend busca os dados
        // ------------------------------------------------------------
        if (req.method === "GET" && !id) {
            const { tipo = "", status = "" } = req.query;
            let filtro = "";

            if (tipo === "home") {
                filtro = "AND({destacar_na_homepage}=1, {status_evento}='em andamento')";
            } else if (tipo === "admin") {
                filtro = "{status_evento}='em andamento'";
            } else if (tipo === "all") {
                filtro = null; 
            } else if (status) {
                const allowed = ["em andamento", "proximo", "encerrado"];
                if (allowed.includes(status.toLowerCase())) {
                    filtro = `{status_evento}='${status}'`;
                }
            }

            const params = {
                sort: [{ field: "data_evento", direction: "asc" }],
                pageSize: 50,
            };
            if (filtro) params.filterByFormula = filtro;

            const registros = await base(table).select(params).all();
            
            // ⚠️ O erro de carregamento inicial *pode* vir daqui
            // se 'mapEvento' falhar (pelos helpers ausentes ou dados vazios)
            const eventos = registros.map(mapEvento); 
            return ok(res, { sucesso: true, total: eventos.length, eventos });
        }

        // ------------------------------------------------------------
        // 3. CRIAÇÃO (POST)
        // ------------------------------------------------------------
        if (req.method === "POST" && Object.keys(bodyFields).length > 0) {
            const fields = mapToAirtableFields(bodyFields);
            if (!fields.nome_evento) return err(res, 400, "O nome do evento é obrigatório.");
            
            const registro = await base(table).create([{ fields }], { typecast: true });
            return ok(res, { sucesso: true, mensagem: "Evento criado com sucesso!", evento: mapEvento(registro[0]) });
        }

        // ------------------------------------------------------------
        // 4. ATUALIZAÇÃO (PATCH)
        // ------------------------------------------------------------
        if (req.method === "PATCH" && id && Object.keys(bodyFields).length > 0) {
            const fields = mapToAirtableFields(bodyFields);
            if (Object.keys(fields).length === 0) return err(res, 400, "Nenhum campo para atualizar foi fornecido.");

            const registro = await base(table).update([{ id, fields }], { typecast: true });
            return ok(res, { sucesso: true, mensagem: "Evento atualizado com sucesso!", evento: mapEvento(registro[0]) });
        }

        // ------------------------------------------------------------
        // 5. EXCLUSÃO (DELETE)
        // ------------------------------------------------------------
        if (req.method === "DELETE" && id) {
            await base(table).destroy([id]);
            return ok(res, { sucesso: true, mensagem: "Evento excluído com sucesso!" });
        }

        // ------------------------------------------------------------
        // 6. MÉTODO NÃO SUPORTADO
        // ------------------------------------------------------------
        return err(res, 405, `Método ${req.method} não permitido.`);
    } catch (e) {
        console.error(`Erro /api/eventos (${req.method}):`, e);
        // Garante que o frontend recebe um erro JSON em caso de falha no try/catch
        return err(res, 500, `Erro ao processar a requisição ${req.method}.`, e?.message || e?.toString());
    }
}
