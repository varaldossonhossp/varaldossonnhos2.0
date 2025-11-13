// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (VERSÃO FINAL COM IDS CONFIRMADOS)
// ------------------------------------------------------------
// ✅ Status: IDs, Mapeamento, e Tratamento de Formulário corrigidos.
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
// (IDs RECONFIRMADOS COM SUA LISTA)
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
	'data_evento': 'fldAn1ps5Y1tnJP6d', // Linked Record (Vínculo com Eventos)
	'data_cadastro': 'fldp6UNiNXs1yiCQh', // Campo de sistema para ordenação
	'idade_irmaos': 'fldlG1tqUAXtzKIf8',
	// Campos que podem ser enviados mas não são usados para escrita (por segurança)
	'primeiro_nome': 'fldyuJyd2tWz1z8Sq', // Fórmula, ignorar
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

const FIELD_DATA_CADASTRO = INPUT_MAP.data_cadastro;


// ============================================================
// 🔹 Funções Auxiliares (Otimizado para tratar o Form Data)
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
			
			// CORREÇÃO: Itera sobre os campos para garantir que apenas um valor seja extraído
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
		
		// Checagem de segurança
		if (!body || Object.keys(body).length === 0 && (req.method === "POST" || req.method === "PATCH")) {
			return res.status(400).json({ sucesso: false, mensagem: "Corpo da requisição vazio ou mal formatado." });
		}

		// ============================================================
		// 🔹 GET — Lista de cartinhas (Leitura com IDS)
		// ============================================================
		if (req.method === "GET") {
			const { evento } = req.query; // Query string "evento"

			let selectConfig = {
				sort: [{ field: FIELD_DATA_CADASTRO, direction: "desc" }], 
			};

			// Filtra por ID de evento se fornecido
			if (evento && INPUT_MAP.data_evento) {
				selectConfig = {
					...selectConfig,
					// Filtra o Linked Record pelo ID do registro (recXXXX)
					filterByFormula: `SEARCH("${evento}", ARRAYJOIN({${INPUT_MAP.data_evento}}))`,
				};
			}

			const records = await base(tableName).select(selectConfig).all();

			const cartinha = records.map((r) => {
				// Função auxiliar para ler o campo pelo ID ou nome (para campos de Lookup)
				const getField = (key) => r.fields[INPUT_MAP[key]] || r.fields[key] || "";

				return {
					id: r.id,
					// Campos principais mapeados por ID
					nome_crianca: getField('nome_crianca'), 
					idade: getField('idade'),
					sexo: getField('sexo'),
					sonho: getField('sonho'),
					// Retorna o array de imagens do campo Attachment
					imagem_cartinha: r.fields[INPUT_MAP.imagem_cartinha] || [], 
					status: getField('status'),
					escola: getField('escola'),
					cidade: getField('cidade'),
					telefone_contato: getField('telefone_contato'),
					irmaos: getField('irmaos'),
					idade_irmaos: getField('idade_irmaos'),
					psicologa_responsavel: getField('psicologa_responsavel'),
					observacoes_admin: getField('observacoes_admin'),
					data_cadastro: getField('data_cadastro'), 

					// Lookups (Nomes literais como vêm do Airtable)
					nome_evento: r.fields["nome_evento (from data_evento)"] || "",
					data_evento: r.fields["data_evento (from data_evento)"] || "",
					data_limite_recebimento: r.fields["data_limite_recebimento (from data_evento)"] || "",
					// Retorna o ID do Linked Record [recXXXX]
					evento_id: r.fields[INPUT_MAP.data_evento]?.[0] || "",
				};
			});

			return res.status(200).json({ sucesso: true, cartinha });
		}

		// ============================================================
		// 🔹 POST — Criação de nova cartinha (Escrita com IDS)
		// ============================================================
		if (req.method === "POST") {
			const sexoKey = (body.sexo || "").toLowerCase();
			const statusKey = (body.status || "").toLowerCase();
			const evento_id = body.evento_id || body.data_evento || ""; 
			
			let imagem_cartinha = [];
			try {
				// Converte a string JSON do frontend para o formato de Attachment do Airtable
				imagem_cartinha = body.imagem_cartinha ? JSON.parse(body.imagem_cartinha) : [];
			} catch {
				imagem_cartinha = [];
			}
			
			const fieldsToCreate = {};

			// Mapeamento principal de campos
			const dataMap = {
				'nome_crianca': body.nome_crianca || "",
				'idade': parseInt(body.idade) || null,
				'sonho': body.sonho || "",
				'escola': body.escola || "",
				'cidade': body.cidade || "",
				'telefone_contato': body.telefone_contato || "",
				'psicologa_responsavel': body.psicologa_responsavel || "",
				'observacoes_admin': body.observacoes_admin || "",
				'irmaos': parseInt(body.irmaos) || null,
				'idade_irmaos': body.idade_irmaos || "",
				'imagem_cartinha': imagem_cartinha,
				// Mapeia o nome da opção para o ID da opção Single Select
				'sexo': OPCOES_SEXO[sexoKey] || OPCOES_SEXO.menino, 
				'status': OPCOES_STATUS[statusKey] || OPCOES_STATUS.disponivel,
			};

			// Transfere dados para o formato Airtable usando IDs
			for (const key in dataMap) {
				const fieldId = INPUT_MAP[key];
				if (fieldId) { // Só inclui se o ID do campo for válido
					fieldsToCreate[fieldId] = dataMap[key];
				}
			}
			
			// Adiciona o Linked Record (data_evento) com checagem de ID (recXXXX)
			const eventFieldId = INPUT_MAP.data_evento;
			if (eventFieldId && evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
				fieldsToCreate[eventFieldId] = [evento_id];
			}

			const novo = await base(tableName).create([{ fields: fieldsToCreate }]);
			return res.status(200).json({ sucesso: true, novo });
		}

		// ============================================================
		// 🔹 PATCH — Atualizar cartinha existente (Escrita com IDS)
		// ============================================================
		if (req.method === "PATCH") {
			const { id } = req.query;
			if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

			const sexoKey = (body.sexo || "").toLowerCase();
			const statusKey = (body.status || "").toLowerCase();
			const evento_id = body.evento_id || body.data_evento || ""; 

			const fieldsToUpdate = {};
			
			// Mapeamento de campos comuns (o valor undefined é ignorado na atualização)
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

			// Atualização de imagem (Attachment)
			if (body.imagem_cartinha) {
				try {
					const img = JSON.parse(body.imagem_cartinha);
					const fieldId = INPUT_MAP.imagem_cartinha;
					// Garante que é um array antes de atualizar o campo Attachment
					if (Array.isArray(img) && fieldId) fieldsToUpdate[fieldId] = img;
				} catch { }
			}

			// Atualização de vínculo de evento (data_evento)
			const eventFieldId = INPUT_MAP.data_evento;
			if (eventFieldId) {
				if (evento_id && typeof evento_id === 'string' && evento_id.startsWith('rec')) {
					fieldsToUpdate[eventFieldId] = [evento_id]; // Vincula
				} else if (evento_id === "") {
					fieldsToUpdate[eventFieldId] = []; // Remove o vínculo (Limpa o campo)
				}
			}

			if (Object.keys(fieldsToUpdate).length === 0) {
				return res.status(400).json({ sucesso: false, mensagem: "Nenhum campo válido para atualização foi fornecido." });
			}

			const atualizado = await base(tableName).update([{ id, fields: fieldsToUpdate }]);
			return res.status(200).json({ sucesso: true, atualizado });
		}
		
		// ============================================================
		// 🔹 DELETE — Excluir cartinha
		// ============================================================
		if (req.method === "DELETE") {
			const { id } = req.query;
			if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

			await base(tableName).destroy([id]);
			return res.status(200).json({ sucesso: true, mensagem: "Cartinha excluída!" });
		}
		
		res.status(405).json({ sucesso: false, mensagem: `Método ${req.method} não permitido.` });
	} catch (e) {
		console.error("🔥 Erro /api/cartinha:", e);
		const errorMessage = e.message || "Erro desconhecido ao processar a requisição Airtable.";
		res.status(500).json({ sucesso: false, mensagem: `Erro na API: ${errorMessage}` });
	}
}