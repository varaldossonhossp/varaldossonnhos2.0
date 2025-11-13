// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (versão final TCC Cloudinary + Sessão Admin)
// ------------------------------------------------------------
// 🔹 Upload de imagem via Cloudinary (URL pública enviada pelo front-end)
// 🔹 Compatível com Vercel (sem uso de Base64 nem Buffer)
// 🔹 Validação de campos Single Select (sexo, status)
// 🔹 Integração com eventos
// 🔹 Mantém GET, POST, PATCH, DELETE originais
// 🔹 ADIÇÃO: suporte a cadastro_sessao_id (painel admin)
// 🔹 ADIÇÃO: GET com filtro por sessão (?session=123)
// 🔹 AJUSTE: inclusão dos campos irmaos e idade_irmaos
// ============================================================

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
// 🔄 Parser de formulário multipart
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

    // ==========================================================
    // 🔹 GET — Lista de cartinhas (com filtro por evento ou sessão)
    // ==========================================================
    if (req.method === "GET") {
      const { evento, session } = req.query;

      let selectConfig = {
        sort: [{ field: "data_cadastro", direction: "desc" }],
      };

      // 🔵 FILTRO ORIGINAL: EVENTO
      if (evento) {
        selectConfig = {
          ...selectConfig,
          filterByFormula: `{evento_id} = "${evento}"`,
        };
      }

      // 🟢 FILTRO NOVO: SESSÃO ADMIN
      if (session) {
        selectConfig = {
          ...selectConfig,
          filterByFormula: `{cadastro_sessao_id} = "${session}"`,
        };
      }

      const records = await base(tableName).select(selectConfig).all();

      const cartinha = records.map((r) => ({
        id: r.id,
        nome_crianca: r.fields.nome_crianca || "",
        idade: r.fields.idade || "",
        sexo: r.fields.sexo || "",
        irmaos: r.fields.irmaos || "",
        idade_irmaos: r.fields.idade_irmaos || "",
        sonho: r.fields.sonho || "",
        escola: r.fields.escola || "",
        cidade: r.fields.cidade || "",
        telefone_contato: r.fields.telefone_contato || "",
        psicologa_responsavel: r.fields.psicologa_responsavel || "",
        imagem_cartinha: r.fields.imagem_cartinha || [],
        status: r.fields.status || "",
        observacoes_admin: r.fields.observacoes_admin || "",

        // Campos de evento
        nome_evento: r.fields.nome_evento || "",
        data_evento: r.fields.data_evento || "",
        data_limite_recebimento: r.fields.data_limite_recebimento || "",
        evento_id: r.fields.evento_id || "",

        // Sessão
        cadastro_sessao_id: r.fields.cadastro_sessao_id || "",
      }));

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ==========================================================
    // 🔹 POST — Criar nova cartinha
    // ==========================================================
    if (req.method === "POST") {
      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const sexo = sexoValido.includes((body.sexo || "").toLowerCase())
        ? body.sexo.toLowerCase()
        : "menino";

      const status = statusValido.includes((body.status || "").toLowerCase())
        ? body.status.toLowerCase()
        : "disponivel";

      // 🔹 Imagem Cloudinary (array de anexos)
      let imagem_cartinha = [];
      try {
        imagem_cartinha = body.imagem_cartinha
          ? JSON.parse(body.imagem_cartinha)
          : [];
      } catch {
        imagem_cartinha = [];
      }

      // 🔹 Campos de evento (opcionais)
      const nome_evento = body.nome_evento || "";
      const data_evento = body.data_evento || "";
      const data_limite_recebimento = body.data_limite_recebimento || "";
      const evento_id = body.evento_id || "";

      // 🔹 Sessão admin (opcional)
      const cadastro_sessao_id = body.cadastro_sessao_id || "";

      const novo = await base(tableName).create([
        {
          fields: {
            nome_crianca: body.nome_crianca,
            idade: body.idade ? parseInt(body.idade, 10) : null,
            sexo,
            irmaos: body.irmaos ? parseInt(body.irmaos, 10) : null,
            idade_irmaos: body.idade_irmaos || "",
            sonho: body.sonho,
            imagem_cartinha,
            escola: body.escola,
            cidade: body.cidade,
            telefone_contato: body.telefone_contato,
            psicologa_responsavel: body.psicologa_responsavel,
            observacoes_admin: body.observacoes_admin || "",
            status,

            // Campos de evento
            nome_evento,
            data_evento,
            data_limite_recebimento,
            evento_id,

            // Sessão admin
            cadastro_sessao_id,
          },
        },
      ]);

      return res.status(200).json({ sucesso: true, novo });
    }

    // ==========================================================
    // 🔹 PATCH — Atualizar cartinha existente
    // ==========================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório para atualização.",
        });

      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const fieldsToUpdate = {
        nome_crianca: body.nome_crianca,
        idade: body.idade ? parseInt(body.idade, 10) : null,
        sonho: body.sonho,
        escola: body.escola,
        cidade: body.cidade,
        telefone_contato: body.telefone_contato,
        psicologa_responsavel: body.psicologa_responsavel,
        observacoes_admin: body.observacoes_admin || "",
      };

      if (body.irmaos !== undefined) {
        fieldsToUpdate.irmaos = body.irmaos
          ? parseInt(body.irmaos, 10)
          : null;
      }
      if (body.idade_irmaos !== undefined) {
        fieldsToUpdate.idade_irmaos = body.idade_irmaos || "";
      }

      if (sexoValido.includes((body.sexo || "").toLowerCase()))
        fieldsToUpdate.sexo = body.sexo.toLowerCase();

      if (statusValido.includes((body.status || "").toLowerCase()))
        fieldsToUpdate.status = body.status.toLowerCase();

      if (body.imagem_cartinha) {
        try {
          const img = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(img)) fieldsToUpdate.imagem_cartinha = img;
        } catch {
          // silencioso
        }
      }

      // 🔹 Atualiza evento (se vier)
      if (body.nome_evento) fieldsToUpdate.nome_evento = body.nome_evento;
      if (body.data_evento) fieldsToUpdate.data_evento = body.data_evento;
      if (body.data_limite_recebimento)
        fieldsToUpdate.data_limite_recebimento =
          body.data_limite_recebimento;
      if (body.evento_id) fieldsToUpdate.evento_id = body.evento_id;

      // 🔹 Atualiza sessão (se vier)
      if (body.cadastro_sessao_id)
        fieldsToUpdate.cadastro_sessao_id = body.cadastro_sessao_id;

      const atualizado = await base(tableName).update([
        { id, fields: fieldsToUpdate },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ==========================================================
    // 🔹 DELETE — Mantido exatamente como estava
    // ==========================================================
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório.",
        });

      await base(tableName).destroy([id]);
      return res
        .status(200)
        .json({ sucesso: true, mensagem: "Cartinha excluída!" });
    }

    // ==========================================================
    // ❌ Método não suportado
    // ==========================================================
    res.status(405).json({
      sucesso: false,
      mensagem: `Método ${req.method} não permitido.`,
    });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
}
