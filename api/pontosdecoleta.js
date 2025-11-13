/* ============================================================
   💙 VARAL DOS SONHOS — API / Pontos de Coleta
   ------------------------------------------------------------
   CRUD completo para administração dos pontos de coleta.
   Integração direta com Airtable, compatível com Vercel.

   Tabela: "pontos_coleta" — Campos utilizados:

   🔹 nome_ponto          (Single line text)
       Nome público do ponto de coleta.

   🔹 cep                 (Single line text)
       Armazenado como texto. Formato com máscara: 00000-000.
       Usado para busca automática de endereço via ViaCEP (front).

   🔹 numero              (Single line text)
       Número do endereço — separado da rua.

   🔹 endereco            (Single line text)
       Ex: “Rua X, Bairro Y, Cidade - UF”.
       Preenchido automaticamente via CEP + manual.

   🔹 telefone            (Phone number)
       Máscara no front-end: (11) 99999-9999.

   🔹 email_ponto         (Email)
       Email direto do responsável pelo ponto.

   🔹 horario             (Single line text)
       Ex: “Seg a Sex, 8h às 18h”.

   🔹 responsavel         (Single line text)
       Pessoa responsável pelo ponto.

   🔹 status              (Single select)
       Valores aceitos:
         - ativo
         - inativo

   🔹 data_cadastro       (Date — ISO)
       Preenchido automaticamente na criação:
       formato: YYYY-MM-DD

   ------------------------------------------------------------
   Endpoints disponíveis:
   ------------------------------------------------------------
   • GET    → Lista todos os pontos
   • POST   → Cria novo ponto
   • PATCH  → Edita um ponto existente
   • DELETE → Remove um ponto

   🔧 Função fetchComRetry()
   Garante maior estabilidade em chamadas ao Airtable,
   realizando várias tentativas automáticas em caso de falhas temporárias.

   ------------------------------------------------------------
   IMPORTANTE:
   - Não alterar nomes dos campos sem ajustar também no Airtable.
   - Esta API é utilizada em outras páginas; NÃO modificar métodos.
   ============================================================ */

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// ============================================================
// 🔁 Função auxiliar — Tentativa automática com retries
// ============================================================
async function fetchComRetry(acao, tentativas = 3, delayMs = 1000) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await acao();
    } catch (erro) {
      console.warn(`⚠️ Tentativa ${i + 1} falhou: ${erro.message}`);
      if (i === tentativas - 1) throw erro;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);

  const tabela = base(process.env.AIRTABLE_PONTOS_TABLE || "pontos_coleta");

  try {
    // ============================================================
    // 📌 GET — Listar todos os pontos
    // ============================================================
    if (req.method === "GET") {
      const registros = await fetchComRetry(() =>
        tabela
          .select({
            maxRecords: 100,
            sort: [{ field: "nome_ponto", direction: "asc" }],
          })
          .all()
      );

      const pontos = registros.map((r) => ({
        id_ponto: r.id,
        nome_ponto: r.get("nome_ponto"),
        cep: r.get("cep"),
        numero: r.get("numero"),
        endereco: r.get("endereco"),
        telefone: r.get("telefone"),
        email_ponto: r.get("email_ponto"),
        horario: r.get("horario"),
        responsavel: r.get("responsavel"),
        status: r.get("status"),
        data_cadastro: r.get("data_cadastro"),
      }));

      return res.status(200).json({ sucesso: true, pontos });
    }

    // ============================================================
    // 📌 POST — Criar novo ponto
    // ============================================================
    else if (req.method === "POST") {
      const dados = {
        nome_ponto: req.body.nome_ponto,
        cep: req.body.cep,
        numero: req.body.numero,
        endereco: req.body.endereco,
        telefone: req.body.telefone,
        email_ponto: req.body.email_ponto,
        horario: req.body.horario,
        responsavel: req.body.responsavel,
        status: req.body.status || "ativo",
        data_cadastro: new Date().toISOString().split("T")[0], // formato ISO
      };

      const novo = await tabela.create([{ fields: dados }]);

      return res
        .status(201)
        .json({ sucesso: true, ponto: { id_ponto: novo[0].id, ...dados } });
    }

    // ============================================================
    // 📌 PATCH — Editar ponto existente
    // ============================================================
    else if (req.method === "PATCH") {
      const { id_ponto, ...fields } = req.body;

      if (!id_ponto)
        return res
          .status(400)
          .json({ sucesso: false, mensagem: "ID do ponto é obrigatório" });

      const atualizado = await tabela.update([{ id: id_ponto, fields }]);

      return res
        .status(200)
        .json({ sucesso: true, ponto: { id_ponto, ...fields } });
    }

    // ============================================================
    // 📌 DELETE — Apagar ponto de coleta
    // ============================================================
    else if (req.method === "DELETE") {
      const { id_ponto } = req.body;

      if (!id_ponto)
        return res
          .status(400)
          .json({ sucesso: false, mensagem: "ID do ponto é obrigatório" });

      await tabela.destroy([id_ponto]);

      return res
        .status(200)
        .json({ sucesso: true, mensagem: "Ponto excluído com sucesso." });
    }

    // ============================================================
    // ❌ Método não suportado
    // ============================================================
    else {
      res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
      return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (erro) {
    console.error("Erro API pontos_coleta:", erro);
    return res.status(500).json({ sucesso: false, mensagem: erro.message });
  }
}
