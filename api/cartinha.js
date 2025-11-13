// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js
// ------------------------------------------------------------
// - Upload de imagem via Cloudinary (já vem pronta do front)
// - Compatível com Vercel (form-data + formidable)
// - Campos alinhados com a tabela "cartinha" do Airtable:
//
//   Tabela CARTINHA – campos usados aqui:
//   - nome_crianca          (Single line text)
//   - idade                 (Number)
//   - sexo                  (Single select: menino/menina/outro)
//   - sonho                 (Long text)
//   - escola                (Single line text)
//   - cidade                (Single line text)
//   - telefone_contato      (Single line text)
//   - psicologa_responsavel (Single line text)
//   - imagem_cartinha       (Attachment)
//   - irmaos                (Number)
//   - idade_irmaos          (Single line text)
//   - observacoes_admin     (Long text)
//   - status                (Single select: disponivel/adotada/inativa)
//   - cadastro_sessao_id    (Single line text — opcional)
//
// - Mantém GET, PATCH e DELETE sem quebrar código existente
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable";

// ============================================================
// ⚙️ Configuração essencial para form-data no Vercel
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
      for (const key in fields) {
        parsedFields[key] = Array.isArray(fields[key])
          ? fields[key][0]
          : fields[key];
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

  // ========================================================
  // 🔹 GET — Lista de cartinhas 
  // ========================================================
  if (req.method === "GET") {
    const { evento, session } = req.query;

    let selectConfig = {
      sort: [{ field: "data_cadastro", direction: "desc" }],
    };

    if (evento) {
      selectConfig.filterByFormula = `{id_evento} = "${evento}"`;
    }

    if (session) {
      selectConfig.filterByFormula = `{cadastro_sessao_id} = "${session}"`;
    }

    // 1) Buscar todas as CARTINHAS
    const records = await base(tableName).select(selectConfig).all();

    // 2) Buscar todos os EVENTOS uma única vez
    const eventosAirtable = await base("eventos").select().all();
    const eventosById = {};
    eventosAirtable.forEach((ev) => {
      eventosById[ev.id] = ev.fields.nome_evento || "";
    });

    // 3) Expandir evento_nome em cada cartinha
    const cartinha = records.map((r) => {
      let evento_nome = "";

      if (Array.isArray(r.fields.id_evento)) {
        evento_nome = r.fields.id_evento
          .map((id) => eventosById[id] || "")
          .join(", ");
      }

      return {
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
        irmaos: r.fields.irmaos ?? null,
        idade_irmaos: r.fields.idade_irmaos || "",
        status: r.fields.status || "",
        observacoes_admin: r.fields.observacoes_admin || "",
        cadastro_sessao_id: r.fields.cadastro_sessao_id || "",

        // Retornos de campos auxiliares (se existirem)
        nome_evento: r.fields.nome_evento || "",
        data_evento: r.fields.data_evento || "",
        data_limite_recebimento: r.fields.data_limite_recebimento || "",
        id_evento: r.fields.id_evento || "",

        // 👉 EXPANSÃO REAL DO NOME DO EVENTO
        evento_nome,
      };
    });

    return res.status(200).json({ sucesso: true, cartinha });
  }


    // ========================================================
    // 🔹 POST — Criar nova cartinha
    // ========================================================
    if (req.method === "POST") {
      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      // Normaliza sexo / status
      const sexo =
        sexoValido.includes((body.sexo || "").toLowerCase()) ?
          body.sexo.toLowerCase() :
          "menina";

      const status =
        statusValido.includes((body.status || "").toLowerCase()) ?
          body.status.toLowerCase() :
          "disponivel";

      // Número de irmãos (campo Number no Airtable)
      let irmaosNumber = null;
      if (body.irmaos !== undefined && body.irmaos !== "") {
        const n = parseInt(String(body.irmaos).replace(/\D/g, ""), 10);
        if (!Number.isNaN(n)) irmaosNumber = n;
      }

      // Idade dos irmãos (texto livre)
      const idade_irmaos = body.idade_irmaos || "";

      // Imagem (array de attachments)
      let imagem_cartinha = [];
      try {
        if (body.imagem_cartinha) {
          const parsed = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(parsed)) {
            // Garantimos que está no formato [{ url }]
            imagem_cartinha = parsed.map((item) =>
              typeof item === "string" ? { url: item } : item
            );
          }
        }
      } catch {
        imagem_cartinha = [];
      }

      const cadastro_sessao_id = body.cadastro_sessao_id || "";

      const fields = {
        nome_crianca: body.nome_crianca,
        idade: body.idade ? parseInt(body.idade, 10) : null,
        sexo,
        sonho: body.sonho,
        escola: body.escola,
        cidade: body.cidade,
        telefone_contato: body.telefone_contato,
        psicologa_responsavel: body.psicologa_responsavel,
        observacoes_admin: body.observacoes_admin || "",
        status,
        idade_irmaos,
        cadastro_sessao_id,
      };

      if (imagem_cartinha.length > 0) {
        fields.imagem_cartinha = imagem_cartinha;
      }
      if (irmaosNumber !== null) {
        fields.irmaos = irmaosNumber;
      }

      const novo = await base(tableName).create([{ fields }]);

      return res.status(200).json({ sucesso: true, novo });
    }

    // ========================================================
    // 🔹 PATCH — Atualizar cartinha existente
    // ========================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório para atualização.",
        });
      }

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
        idade_irmaos: body.idade_irmaos || "",
      };

      if (sexoValido.includes((body.sexo || "").toLowerCase())) {
        fieldsToUpdate.sexo = body.sexo.toLowerCase();
      }

      if (statusValido.includes((body.status || "").toLowerCase())) {
        fieldsToUpdate.status = body.status.toLowerCase();
      }

      // Atualiza número de irmãos, se vier
      if (body.irmaos !== undefined) {
        if (body.irmaos === "") {
          // Se vier vazio, podemos remover / setar null
          fieldsToUpdate.irmaos = null;
        } else {
          const n = parseInt(String(body.irmaos).replace(/\D/g, ""), 10);
          if (!Number.isNaN(n)) fieldsToUpdate.irmaos = n;
        }
      }

      // Atualiza imagem, se vier
      if (body.imagem_cartinha) {
        try {
          const imgParsed = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(imgParsed)) {
            fieldsToUpdate.imagem_cartinha = imgParsed.map((item) =>
              typeof item === "string" ? { url: item } : item
            );
          }
        } catch {
          // se der erro, ignora imagem para não quebrar
        }
      }

      if (body.cadastro_sessao_id) {
        fieldsToUpdate.cadastro_sessao_id = body.cadastro_sessao_id;
      }

      const atualizado = await base(tableName).update([
        { id, fields: fieldsToUpdate },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ========================================================
    // 🔹 DELETE — Excluir cartinha
    // ========================================================
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório.",
        });
      }

      await base(tableName).destroy([id]);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Cartinha excluída!",
      });
    }

    // ========================================================
    // ❌ Método não suportado
    // ========================================================
    res.status(405).json({
      sucesso: false,
      mensagem: `Método ${req.method} não permitido.`,
    });
  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    res.status(500).json({
      sucesso: false,
      mensagem: e.message || "Erro interno no servidor.",
    });
  }
}
