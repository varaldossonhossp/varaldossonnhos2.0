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
//   - data_ultima_atualizacao (Date/Time)
// ============================================================

import Airtable from "airtable";

export const config = { runtime: "nodejs" };

// Nomes das tabelas no Airtable
const TB_USUARIO = "usuario";
const TB_ADOCOES = "adocoes";
const TB_GAMI = "gamificacao";

// ------------------------------------------------------------
// 🎯 Regras de gamificação (substituem a antiga regras_gamificacao)
// ------------------------------------------------------------
const REGRAS_GAMI = [
  {
    faixa_minima: 1,
    nivel: "Iniciante",
    titulo_conquista: "💙 Coração Azul — cada ato seu espalha sonhos.",
    descricao:
      "Seu coração abriu caminhos para um novo começo, espalhando luz e esperança onde antes havia espera.",
  },
  {
    faixa_minima: 2,
    nivel: "Intermediário",
    titulo_conquista: "❤️ Segundo gesto de amor — Você acendeu uma estrela!",
    descricao: "Cada ato seu espalha sonhos.",
  },
  {
    faixa_minima: 3,
    nivel: "Intermediário",
    titulo_conquista: "👑 Mestre dos Sonhos",
    descricao:
      "Você faz do mundo um lugar mais generoso, levando esperança a quem mais precisa com cada escolha solidária.",
  },
  {
    faixa_minima: 4,
    nivel: "Avançado",
    titulo_conquista: "🌟 Guardião dos Sonhos — você faz o bem brilhar!",
    descricao:
      "Você acende novas possibilidades e espalha esperança, mostrando que cada gesto de cuidado pode mudar destinos.",
  },
  {
    faixa_minima: 5,
    nivel: "Lendário",
    titulo_conquista:
      "👑 Lenda dos Sonhos — símbolo de esperança e solidariedade.",
    descricao:
      "Você inspira um futuro melhor, mostrando que cada ato de generosidade pode acender sonhos e unir corações.",
  },
];

// ------------------------------------------------------------
// 🔧 Helper → Inicializa Airtable
// ------------------------------------------------------------
function getBase() {
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

// ------------------------------------------------------------
// 🔧 Helper → Decide nível / título conforme total de adoções
// ------------------------------------------------------------
function calcularNivelETitulo(totalAdocoes) {
  let nivel = "Iniciante";
  let titulo =
    "💙 Coração Azul — cada ato seu espalha sonhos."; // padrão para 1 adoção
  for (const regra of REGRAS_GAMI) {
    if (totalAdocoes >= regra.faixa_minima) {
      nivel = regra.nivel;
      titulo = regra.titulo_conquista;
    }
  }
  return { nivel, titulo };
}

// ------------------------------------------------------------
// 🌟 HANDLER PRINCIPAL
// ------------------------------------------------------------
export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ sucesso: false, mensagem: "Use o método GET." });
  }

  try {
    const base = getBase();

    const { email_usuario, id_usuario } = req.query || {};

    if (!email_usuario && !id_usuario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe email_usuario ou id_usuario na query string.",
      });
    }

    // ========================================================
    // 1️⃣ Localizar o usuário (por email OU id)
    // ========================================================
    let usuarioRecord = null;

    if (id_usuario) {
      // Busca direta pelo recordId
      try {
        usuarioRecord = await base(TB_USUARIO).find(id_usuario);
      } catch (e) {
        usuarioRecord = null;
      }
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

    // Se não encontrou o usuário → sem gamificação, mas devolve regras
    if (!usuarioRecord) {
      return res.status(200).json({
        sucesso: true,
        gamificacao: null,
        regras: REGRAS_GAMI,
      });
    }

    const idUsuarioRecord = usuarioRecord.id;

    // ========================================================
    // 2️⃣ Contar adoções desse usuário com status "presente entregue"
    // ========================================================
    const adocoesConcluidas = await base(TB_ADOCOES)
      .select({
        filterByFormula: `AND(
          SEARCH('${idUsuarioRecord}', ARRAYJOIN({usuario})),
          {status_adocao} = 'presente entregue'
        )`,
      })
      .all();

    const totalAdocoes = adocoesConcluidas.length;

    // ========================================================
    // 3️⃣ Calcular nível, título e pontos de coração
    // ========================================================
    const { nivel, titulo } = calcularNivelETitulo(totalAdocoes);

    // Exemplo simples: 10 pontos por adoção concluída
    const pontos = totalAdocoes * 10;
    const agoraISO = new Date().toISOString();

    // ========================================================
    // 4️⃣ Procurar registro de gamificação existente
    // ========================================================
    const registrosGami = await base(TB_GAMI)
      .select({
        maxRecords: 1,
        filterByFormula: `SEARCH('${idUsuarioRecord}', ARRAYJOIN({usuario}))`,
      })
      .all();

    let registroFinal;

    if (registrosGami.length > 0) {
      // 🔄 Atualizar registro existente
      const rec = registrosGami[0];
      registroFinal = await base(TB_GAMI).update(rec.id, {
        total_adocoes: totalAdocoes,
        pontos_coracao: pontos,
        nivel_gamificacao_atual: nivel,
        titulo_conquista_atual: titulo,
        data_ultima_atualizacao: agoraISO,
      });
    } else {
      // ✨ Criar um novo registro
      const criados = await base(TB_GAMI).create([
        {
          fields: {
            usuario: [idUsuarioRecord],
            total_adocoes: totalAdocoes,
            pontos_coracao: pontos,
            nivel_gamificacao_atual: nivel,
            titulo_conquista_atual: titulo,
            data_ultima_atualizacao: agoraISO,
          },
        },
      ]);
      registroFinal = criados[0];
    }

    const f = registroFinal.fields || {};

    const gamificacao = {
      total_adocoes: f.total_adocoes ?? totalAdocoes,
      pontos_coracao: f.pontos_coracao ?? pontos,
      nivel_gamificacao_atual: f.nivel_gamificacao_atual ?? nivel,
      titulo_conquista_atual: f.titulo_conquista_atual ?? titulo,
      data_ultima_atualizacao: f.data_ultima_atualizacao ?? agoraISO,
    };

    // ========================================================
    // 5️⃣ Retorno final para o front
    // ========================================================
    return res.status(200).json({
      sucesso: true,
      gamificacao,
      regras: REGRAS_GAMI,
    });
  } catch (e) {
    console.error("❌ API ERRO gamificacao_unificada:", e);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno na gamificação.",
      detalhe: e.message,
    });
  }
}
