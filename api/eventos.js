// ============================================================
// 💙 VARAL DOS SONHOS — /api/eventos.js
// ------------------------------------------------------------
// Este endpoint acessa a tabela "eventos" no Airtable e retorna
// apenas os eventos ativos (campo "ativo" = true).
//
// Estrutura da resposta JSON:
// {
//   sucesso: true,
//   eventos: [
//     {
//       id: "...",
//       titulo: "...",
//       descricao: "...",
//       data_evento: "2025-10-20",
//       imagens: ["url1", "url2", ...],
//       ativo: true
//     }
//   ]
// }
// ============================================================

import Airtable from "airtable"; // 📦 Importa o SDK oficial do Airtable

// ============================================================
// 🔐 Conexão com o banco Airtable
// ------------------------------------------------------------
// As chaves são armazenadas de forma segura no arquivo .env.local
//   AIRTABLE_API_KEY=pat_xxxxx
//   AIRTABLE_BASE_ID=app_xxxxx
// ============================================================
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

// ============================================================
// ⚙️ Função principal do endpoint /api/eventos
// ============================================================
export default async function handler(req, res) {
  try {
    // Busca todos os registros da tabela "eventos"
    const records = await base("eventos").select({}).all();

    // Mapeia os dados retornados do Airtable para um formato limpo
    const eventos = records
      .map((r) => ({
        id: r.id, // ID interno do Airtable (não exibido no front)
        titulo: r.fields.titulo || "Evento sem título",
        descricao: r.fields.descricao || "",
        data_evento: r.fields.data_evento || "",
        // ⚡ Aqui tratamos o campo "imagem" (que vem como array de objetos)
        // e transformamos em um array simples com as URLs
        imagens: Array.isArray(r.fields.imagem)
          ? r.fields.imagem.map((img) => img.url)
          : [],
        ativo: r.fields.ativo === true // Garante booleano
      }))
      // Filtra apenas os eventos marcados como "ativo = true"
      .filter((evento) => evento.ativo);

    // ============================================================
    // ✅ Resposta de sucesso
    // ------------------------------------------------------------
    // Retorna JSON acessível ao front-end (galeria.js)
    // ============================================================
    res.status(200).json({
      sucesso: true,
      total_eventos: eventos.length,
      eventos
    });
  } catch (erro) {
    // ============================================================
    // ❌ Em caso de erro (ex: conexão inválida, chave incorreta)
    // ============================================================
    console.error("Erro ao buscar eventos no Airtable:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar à tabela de eventos.",
      detalhe: erro.message
    });
  }
}
