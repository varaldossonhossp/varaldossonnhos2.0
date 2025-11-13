// ============================================================
// 💙 VARAL DOS SONHOS — /api/cartinha.js (versão final revisada)
// ============================================================

import Airtable from "airtable";
import { IncomingForm } from "formidable";

export const config = {
  api: { bodyParser: false },
  runtime: "nodejs",
};

// Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_CARTINHA_TABLE || "cartinha";

// CORS
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Parser multipart
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      const parsed = {};
      for (const key in fields) {
        parsed[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      }
      resolve({ fields: parsed, files });
    });
  });
}

// ============================================================
// HANDLER
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
    // GET — Lista de cartinhas com expansão de eventos
    // ========================================================
    if (req.method === "GET") {
      const { evento, session } = req.query;

      // Criar filtro correto sem sobrescrever
      const filtros = [];

      if (evento) filtros.push(`{id_evento} = "${evento}"`);
      if (session) filtros.push(`{cadastro_sessao_id} = "${session}"`);

      let selectConfig = { sort: [{ field: "data_cadastro", direction: "desc" }] };

      if (filtros.length === 1) {
        selectConfig.filterByFormula = filtros[0];
      } else if (filtros.length > 1) {
        selectConfig.filterByFormula = `AND(${filtros.join(",")})`;
      }

      // Buscar cartinhas
      const records = await base(tableName).select(selectConfig).all();

      // Buscar eventos (nome + datas)
      const eventosAirtable = await base("eventos").select().all();
      const eventosById = {};

      eventosAirtable.forEach(ev => {
        eventosById[ev.id] = {
          nome: ev.fields.nome_evento || "",
          data_evento: ev.fields.data_evento || "",
          data_limite_recebimento: ev.fields.data_limite_recebimento || ""
        };
      });

      const cartinhas = records.map((r) => {
        const f = r.fields;

        let evento_nome = "";
        let data_evento = "";
        let data_limite_recebimento = "";

        if (Array.isArray(f.id_evento) && f.id_evento.length > 0) {
          const ev = eventosById[f.id_evento[0]];
          if (ev) {
            evento_nome = ev.nome;
            data_evento = ev.data_evento;
            data_limite_recebimento = ev.data_limite_recebimento;
          }
        }

        return {
          id: r.id,
          nome_crianca: f.nome_crianca || "",
          idade: f.idade || "",
          sexo: f.sexo || "",
          sonho: f.sonho || "",
          escola: f.escola || "",
          cidade: f.cidade || "",
          telefone_contato: f.telefone_contato || "",
          psicologa_responsavel: f.psicologa_responsavel || "",
          imagem_cartinha: f.imagem_cartinha || [],
          irmaos: f.irmaos ?? null,
          idade_irmaos: f.idade_irmaos || "",
          observacoes_admin: f.observacoes_admin || "",
          status: f.status || "",
          cadastro_sessao_id: f.cadastro_sessao_id || "",

          id_evento: f.id_evento || [],
          evento_nome,
          data_evento,
          data_limite_recebimento
        };
      });

      return res.status(200).json({ sucesso: true, cartinhas });
    }

    // ========================================================
    // POST — Criar cartinha
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

      let imagem_cartinha = [];
      try {
        if (body.imagem_cartinha) {
          const parsed = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(parsed)) {
            imagem_cartinha = parsed.map((i) =>
              typeof i === "string" ? { url: i } : i
            );
          }
        }
      } catch {}

      let irmaosNumber = null;
      if (body.irmaos !== undefined && body.irmaos !== "") {
        const n = parseInt(body.irmaos.replace(/\D/g, ""), 10);
        if (!Number.isNaN(n)) irmaosNumber = n;
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
        idade_irmaos: body.idade_irmaos || "",
        status,
        cadastro_sessao_id: body.cadastro_sessao_id || "",
      };

      if (irmaosNumber !== null) fields.irmaos = irmaosNumber;
      if (imagem_cartinha.length > 0) fields.imagem_cartinha = imagem_cartinha;

      if (body.id_evento) fields.id_evento = [body.id_evento];

      const novo = await base(tableName).create([{ fields }]);
      return res.status(200).json({ sucesso: true, novo });
    }

    // ========================================================
    // PATCH — Atualizar
    // ========================================================
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id)
        return res.status(400).json({ sucesso: false, mensagem: "ID obrigatório." });

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
        cadastro_sessao_id: body.cadastro_sessao_id || "",
      };

      if (sexoValido.includes((body.sexo || "").toLowerCase()))
        fieldsToUpdate.sexo = body.sexo.toLowerCase();

      if (statusValido.includes((body.status || "").toLowerCase()))
        fieldsToUpdate.status = body.status.toLowerCase();

      if (body.irmaos !== undefined) {
        if (body.irmaos === "") fieldsToUpdate.irmaos = null;
        else {
          const n = parseInt(body.irmaos.replace(/\D/g, ""), 10);
          if (!Number.isNaN(n)) fieldsToUpdate.irmaos = n;
        }
      }

      if (body.imagem_cartinha) {
        try {
          const parsed = JSON.parse(body.imagem_cartinha);
          if (Array.isArray(parsed)) {
            fieldsToUpdate.imagem_cartinha = parsed.map((i) =>
              typeof i === "string" ? { url: i } : i
            );
          }
        } catch {}
      }

      if (body.id_evento) fieldsToUpdate.id_evento = [body.id_evento];

      const atualizado = await base(tableName).update([
        { id, fields: fieldsToUpdate },
      ]);

      return res.status(200).json({ sucesso: true, atualizado });
    }

    // ========================================================
    // DELETE — Excluir
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
    res.status(500).json({
      sucesso: false,
      mensagem: e.message || "Erro interno.",
    });
  }
}
