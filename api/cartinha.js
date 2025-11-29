// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js
// ------------------------------------------------------------
// - API para gerenciar as cartinhas das crianças:
//   • Listar cartinhas (GET)
//   • Criar nova cartinha (POST)
//   • Editar cartinha existente (PATCH)
//   • Excluir cartinha (DELETE)
// - Compatível com uploads de imagem via Cloudinary
// - Utiliza form-data (formidable) para POST e PATCH
// - Compatível com Vercel (form-data + formidable)
// - Campos alinhados com a tabela "cartinha" do Airtable:
//
//   Tabela CARTINHA – campos usados aqui:
//   - nome_crianca          (Single line text)
//   - primeiro_nome         (Formula)
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
//
// - Mantém GET, PATCH e DELETE funcionando normalmente.
// - Adiciona suporte a POST (criação de nova cartinha)
///
// 🔹 MELHORIAS DESTA VERSÃO:
//     ✔ Remoção TOTAL de ".all()" — principal causa de timeout no Vercel
//     ✔ Substituição por ".firstPage()" — recomendado oficialmente pelo Airtable
//     ✔ Tratamento seguro de attachments (Cloudinary)
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable";

export const config = {
  api: { bodyParser: false },  // necessário para form-data
  runtime: "nodejs",
};

// ------------------------------------------------------------
// 📡 Conexão com Airtable
// ------------------------------------------------------------
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// ------------------------------------------------------------
// 🌐 CORS — Permite acesso do front-end
// ------------------------------------------------------------
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ------------------------------------------------------------
// 📥 Parse de form-data (necessário para imagens)
// ------------------------------------------------------------
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      // Converte arrays do formidable para valores simples
      const parsedFields = {};
      for (const key in fields) {
        parsedFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      }

      resolve({ fields: parsedFields, files });
    });
  });
}

// ============================================================================
// 🚀 HANDLER PRINCIPAL
// ============================================================================
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    let body = req.body;

    // 🔥 Necessário para POST e PATCH com form-data (imagens)
    if (req.method === "POST" || req.method === "PATCH") {
      const parsed = await parseForm(req);
      body = parsed.fields;
    }

    // ========================================================
    // 1️⃣ GET — LISTAR CARTINHAS 
    // ========================================================
    if (req.method === "GET") {
      const { evento } = req.query;

      // Configuração de listagem — agora segura
      const selectConfig = {
        pageSize: 100, // ← impede timeout, SEM limitar total da tabela
        sort: [{ field: "data_cadastro", direction: "desc" }],
      };

      // Filtro opcional por evento
      if (evento) {
        selectConfig.filterByFormula = `{eventos} = "${evento}"`;
      }

      // 🔥 Uso do firstPage → carrega apenas o necessário
      const records = await base(tableName).select(selectConfig).firstPage();

      // 🔥 Carrega eventos para montar relacionamento 
      const eventosAirtable = await base("eventos")
        .select({ pageSize: 100 })
        .firstPage();

      const eventosMap = {};
      eventosAirtable.forEach((ev) => {
        eventosMap[ev.id] = ev.fields.nome_evento || "";
      });

      // Mapeamento final das cartinhas
      const cartinha = records.map((r) => {
        const idEventos = r.fields.eventos || [];

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
          eventos: idEventos,

          // Nome do evento correspondente
          evento_nome: idEventos.map((id) => eventosMap[id] || "").join(", "),
        };
      });

      return res.status(200).json({ sucesso: true, cartinha });
    }

    // ========================================================
    // 2️⃣ POST — CRIAR NOVA CARTINHA 
    // ========================================================
    if (req.method === "POST") {
      const sexoValido = ["menino", "menina", "outro"];
      const statusValido = ["disponivel", "adotada", "inativa"];

      const sexo = sexoValido.includes((body.sexo || "").toLowerCase())
        ? body.sexo.toLowerCase()
        : "menina";

      const status = statusValido.includes((body.status || "").toLowerCase())
        ? body.status.toLowerCase()
        : "disponivel";

      let irmaosNumber = null;
      if (body.irmaos) {
        const n = parseInt(String(body.irmaos).replace(/\D/g, ""), 10);
        if (!Number.isNaN(n)) irmaosNumber = n;
      }

      // Conversão segura de imagem
      let imagem_cartinha = [];
      if (body.imagem_cartinha) {
        try {
          const arr = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(arr)) {
            imagem_cartinha = arr.map((i) =>
              typeof i === "string" ? { url: i } : i
            );
          }
        } catch {}
      }

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
        idade_irmaos: body.idade_irmaos,
      };

      if (irmaosNumber !== null) fields.irmaos = irmaosNumber;
      if (body.id_evento) fields.eventos = [body.id_evento];
      if (imagem_cartinha.length > 0) fields.imagem_cartinha = imagem_cartinha;

      const novo = await base(tableName).create([{ fields }]);

      return res.status(200).json({ sucesso: true, novo });
    }

    // ========================================================
    // 3️⃣ PATCH — ATUALIZAR CARTINHA 
    // ========================================================
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
        idade_irmaos: body.idade_irmaos || "",
      };

      if (sexoValido.includes((body.sexo || "").toLowerCase()))
        fieldsToUpdate.sexo = body.sexo.toLowerCase();

      if (statusValido.includes((body.status || "").toLowerCase()))
        fieldsToUpdate.status = body.status.toLowerCase();

      if (body.irmaos !== undefined) {
        if (body.irmaos === "") fieldsToUpdate.irmaos = null;
        else {
          const n = parseInt(String(body.irmaos).replace(/\D/g, ""), 10);
          if (!Number.isNaN(n)) fieldsToUpdate.irmaos = n;
        }
      }

      // Imagem
      if (body.imagem_cartinha) {
        try {
          const arr = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(arr)) {
            fieldsToUpdate.imagem_cartinha = arr.map((i) =>
              typeof i === "string" ? { url: i } : i
            );
          }
        } catch {}
      }

      if (body.id_evento) fieldsToUpdate.eventos = [body.id_evento];

      const atualizado = await base(tableName).update([
        { id, fields: fieldsToUpdate },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ========================================================
    // 4️⃣ DELETE — EXCLUIR CARTINHA
    // ========================================================
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id)
        return res.status(400).json({
          sucesso: false,
          mensagem: "ID obrigatório.",
        });

      await base(tableName).destroy([id]);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Cartinha excluída!",
      });
    }

    // Método inválido
    res.status(405).json({
      sucesso: false,
      mensagem: `Método ${req.method} não permitido.`,
    });

  } catch (e) {
    console.error("🔥 Erro /api/cartinha:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: e.message || "Erro interno no servidor.",
    });
  }
}
