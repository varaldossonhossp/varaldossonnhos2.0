// ============================================================
// 💼 VARAL DOS SONHOS — /api/admin.js
// ------------------------------------------------------------
// Gerencia as funções administrativas do projeto:
//   • GET  → lista eventos ativos (usado no carrossel da Home)
//   • POST modo=eventos  → CRUD de eventos (restrito)
//   • POST modo=galeria  → atualizar imagens do carrossel (restrito)
//   • POST modo=adocao   → confirmar/alterar status de adoções
// ------------------------------------------------------------
// ⚙️ Segurança: operações POST exigem token ADMIN_SECRET (.env.local)
// ============================================================

import Airtable from "airtable";

// Conexão com o banco Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    // ============================================================
    // 🔹 1️⃣ REQUISIÇÃO PÚBLICA (GET) — Lista de eventos ativos
    // ============================================================
    if (req.method === "GET") {
      const { tipo } = req.query;

      // Exemplo: /api/admin?tipo=eventos
      if (tipo === "eventos") {
        const registros = await base("eventos")
          .select({
            filterByFormula: "ativo = 1", // apenas eventos ativos
            sort: [{ field: "data_evento", direction: "desc" }],
          })
          .all();

        const eventos = registros.map((r) => ({
          id: r.id,
          titulo: r.fields.titulo,
          descricao: r.fields.descricao,
          data_evento: r.fields.data_evento,
          imagem: r.fields.imagem || [],
          ativo: r.fields.ativo,
        }));

        return res.status(200).json({ sucesso: true, eventos });
      }

      return res.status(400).json({
        sucesso: false,
        mensagem: "Tipo de consulta inválido ou ausente.",
      });
    }

    // ============================================================
    // 🔒 2️⃣ REQUISIÇÕES ADMINISTRATIVAS (POST)
    // ============================================================
    const { modo, acao, token_admin } = req.body;

    // Segurança — valida o token do administrador
    if (token_admin !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Acesso negado. Token inválido ou ausente.",
      });
    }

    // ============================================================
    // 🎁 3️⃣ GERENCIAR ADOÇÕES — confirmação/entrega
    // ============================================================
    if (modo === "adocao") {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Campos obrigatórios ausentes (id, status).",
        });
      }

      const atualizado = await base("adocoes").update([
        {
          id,
          fields: {
            status,
            data_ultima_atualizacao: new Date().toISOString(),
          },
        },
      ]);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Status da adoção atualizado com sucesso.",
        registro: atualizado,
      });
    }

    // ============================================================
    // 🎊 4️⃣ GERENCIAR EVENTOS — CRUD completo
    // ============================================================
    if (modo === "eventos") {
      const { id_evento, titulo, descricao, data_evento, imagens, ativo } =
        req.body;

      switch (acao) {
        // ➕ Criar evento
        case "criar":
          if (!titulo || !descricao) {
            return res.status(400).json({
              sucesso: false,
              mensagem: "Título e descrição são obrigatórios.",
            });
          }

          const novoEvento = await base("eventos").create([
            {
              fields: {
                titulo,
                descricao,
                data_evento: data_evento || new Date().toISOString(),
                ativo: ativo ?? true,
                imagem: imagens || [],
              },
            },
          ]);

          return res.status(201).json({
            sucesso: true,
            mensagem: "Evento criado com sucesso.",
            evento: novoEvento,
          });

        // ✏️ Atualizar evento
        case "atualizar":
          if (!id_evento) {
            return res.status(400).json({
              sucesso: false,
              mensagem: "ID do evento é obrigatório para atualização.",
            });
          }

          const eventoAtualizado = await base("eventos").update([
            {
              id: id_evento,
              fields: {
                titulo,
                descricao,
                data_evento,
                ativo,
                imagem: imagens,
                data_ultima_atualizacao: new Date().toISOString(),
              },
            },
          ]);

          return res.status(200).json({
            sucesso: true,
            mensagem: "Evento atualizado com sucesso.",
            evento: eventoAtualizado,
          });

        // ❌ Excluir evento
        case "excluir":
          if (!id_evento) {
            return res.status(400).json({
              sucesso: false,
              mensagem: "ID do evento é obrigatório para exclusão.",
            });
          }

          await base("eventos").destroy([id_evento]);

          return res.status(200).json({
            sucesso: true,
            mensagem: "Evento excluído com sucesso.",
          });

        default:
          return res.status(400).json({
            sucesso: false,
            mensagem: "Ação inválida para modo=eventos.",
          });
      }
    }

    // ============================================================
    // 🖼️ 5️⃣ GERENCIAR GALERIA / CARROSSEL
    // ============================================================
    if (modo === "galeria") {
      const { imagens } = req.body;

      if (!imagens || imagens.length === 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Nenhuma imagem fornecida para atualização.",
        });
      }

      const novaGaleria = await base("galeria").create([
        {
          fields: {
            titulo: "Atualização automática do carrossel",
            imagens,
            data_envio: new Date().toISOString(),
          },
        },
      ]);

      return res.status(201).json({
        sucesso: true,
        mensagem: "Galeria atualizada com sucesso.",
        galeria: novaGaleria,
      });
    }

    // ============================================================
    // 🚫 6️⃣ MODO INVÁLIDO
    // ============================================================
    return res.status(400).json({
      sucesso: false,
      mensagem: "Modo inválido ou não suportado.",
    });
  } catch (erro) {
    console.error("❌ Erro na API admin:", erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno na API admin.",
      detalhe: erro.message,
    });
  }
}
