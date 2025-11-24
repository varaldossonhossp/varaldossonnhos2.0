// ============================================================
// 🎮 VARAL DOS SONHOS — /api/gamificacao_unificada.js
// ------------------------------------------------------------
// API ÚNICA de gamificação do doador.
//
// Fluxo:
// 1. Recebe email_usuario OU id_usuario (recordId da tabela usuario)
// 2. Encontra o registro do usuário no Airtable
// 3. Conta quantas ADOÇÕES desse usuário estão com status
//    "presente entregue" na tabela "adocoes"
// 4. A partir desse total, calcula:
//      • nivel_gamificacao_atual
//      • titulo_conquista_atual
//      • pontos_coracao
// 5. Atualiza/Cria o registro na tabela "gamificacao"
// 6. Retorna para o front-end:
//      { sucesso, gamificacao, regras }
// ------------------------------------------------------------
// Tabelas usadas:
//   • usuario
//   • adocoes
//   • gamificacao
// ------------------------------------------------------------
// Tabela "gamificacao" (definição recomendada):
//   - usuario (Link to usuario)
//   - total_adocoes (Number)
//   - pontos_coracao (Number)
//   - nivel_gamificacao_atual (Single select: Iniciante, Intermediário,
//                               Avançado, Lendário)
//   - titulo_conquista_atual (Single line text)
//   
// ============================================================


import Airtable from "airtable";

export const config = { runtime: "nodejs" };

const TB_USUARIO = "usuario";
const TB_ADOCOES = "adocoes";
const TB_GAMI = "gamificacao";

// Regras fixas dentro da API
const REGRAS_GAMI = [
  { faixa_minima: 1, nivel: "Iniciante",
    titulo_conquista: "💙 Coração Azul — cada ato seu espalha sonhos.",
    descricao:
      "Seu coração abriu caminhos para um novo começo, espalhando luz e esperança onde antes havia espera." },

  { faixa_minima: 2, nivel: "Intermediário",
    titulo_conquista: "❤️ Segundo gesto de amor — Você acendeu uma estrela!",
    descricao: "Cada ato seu espalha sonhos." },

  { faixa_minima: 3, nivel: "Intermediário",
    titulo_conquista: "👑 Mestre dos Sonhos",
    descricao:
      "Você faz do mundo um lugar mais generoso, levando esperança a quem mais precisa com cada escolha solidária." },

  { faixa_minima: 4, nivel: "Avançado",
    titulo_conquista: "🌟 Guardião dos Sonhos — você faz o bem brilhar!",
    descricao:
      "Você acende novas possibilidades e espalha esperança, mostrando que cada gesto de cuidado pode mudar destinos." },

  { faixa_minima: 5, nivel: "Lendário",
    titulo_conquista:
      "👑 Lenda dos Sonhos — símbolo de esperança e solidariedade.",
    descricao:
      "Você inspira um futuro melhor, mostrando que cada ato de generosidade pode acender sonhos e unir corações." },
];

function getBase() {
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
}

function calcularNivelETitulo(total) {
  let nivel = "Iniciante";
  let titulo =
    "💙 Coração Azul — cada ato seu espalha sonhos.";

  for (const regra of REGRAS_GAMI) {
    if (total >= regra.faixa_minima) {
      nivel = regra.nivel;
      titulo = regra.titulo_conquista;
    }
  }

  return { nivel, titulo };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ sucesso: false, mensagem: "Use GET." });

  try {
    const base = getBase();
    const { email_usuario, id_usuario } = req.query || {};

    if (!email_usuario && !id_usuario)
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe email_usuario ou id_usuario.",
      });

    // ------------------------------------------------------------
    // 1️⃣ Localizar usuário
    // ------------------------------------------------------------
    let usuarioRecord = null;

    if (id_usuario) {
      try {
        usuarioRecord = await base(TB_USUARIO).find(id_usuario);
      } catch {}
    } else if (email_usuario) {
      const emailLower = String(email_usuario).toLowerCase();

      const usuarios = await base(TB_USUARIO)
        .select({
          maxRecords: 1,
          filterByFormula: `LOWER({email_usuario}) = '${emailLower}'`,
        })
        .all();

      usuarioRecord = usuarios[0] || null;
    }

    if (!usuarioRecord) {
      return res.status(200).json({
        sucesso: true,
        gamificacao: null,
        regras: REGRAS_GAMI,
      });
    }

    const idUser = usuarioRecord.id;

    // ------------------------------------------------------------
    // 2️⃣ Contar adoções concluídas
    // ------------------------------------------------------------
    const concluidas = await base(TB_ADOCOES)
      .select({
        filterByFormula: `AND(
          SEARCH('${idUser}', ARRAYJOIN({usuario})),
          {status_adocao} = 'presente entregue'
        )`,
      })
      .all();

    const total = concluidas.length;

    // ------------------------------------------------------------
    // 3️⃣ Calcular nível/título/pontos
    // ------------------------------------------------------------
    const { nivel, titulo } = calcularNivelETitulo(total);
    const pontos = total * 10;

    // ------------------------------------------------------------
    // 4️⃣ Buscar gamificação existente
    // ------------------------------------------------------------
    const existentes = await base(TB_GAMI)
      .select({
        maxRecords: 1,
        filterByFormula: `SEARCH('${idUser}', ARRAYJOIN({usuario}))`,
      })
      .all();

    let registro;

    // ------------------------------------------------------------
    // ⚠️ IMPORTANTE: NÃO ENVIAR "data_ultima_atualizacao"
    // O Airtable atualiza automaticamente
    // ------------------------------------------------------------

    if (existentes.length > 0) {
      registro = await base(TB_GAMI).update(existentes[0].id, {
        total_adocoes: total,
        pontos_coracao: pontos,
        nivel_gamificacao_atual: nivel,
        titulo_conquista_atual: titulo,
      });
    } else {
      const novo = await base(TB_GAMI).create([
        {
          fields: {
            usuario: [idUser],
            total_adocoes: total,
            pontos_coracao: pontos,
            nivel_gamificacao_atual: nivel,
            titulo_conquista_atual: titulo,
            // sem data_ultima_atualizacao
          },
        },
      ]);
      registro = novo[0];
    }

    return res.status(200).json({
      sucesso: true,
      gamificacao: registro.fields,
      regras: REGRAS_GAMI,
    });

  } catch (e) {
    console.error("❌ ERRO gamificacao_unificada:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno na gamificação.",
      detalhe: e.message,
    });
  }
}
