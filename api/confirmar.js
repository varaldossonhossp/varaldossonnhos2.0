// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js (Versão Revisada)
// ------------------------------------------------------------
// • Confirma a adoção (status → "confirmada")
// • Envia e-mail de confirmação ao DOADOR (EmailJS)
// • Atualiza pontuação de gamificação no Airtable
// ------------------------------------------------------------
// Tabelas usadas:
// - adocoes, usuario, cartinha, pontos_coleta, gamificacao, regras_gamificacao.
// ============================================================

import Airtable from "airtable";
// import { URLSearchParams } from "url"; // Comentando, pois em Node/Vercel moderno pode não ser necessário se 'fetch' for global

export const config = { runtime: "nodejs" };

// Função auxiliar para extrair valor de um campo Airtable que pode ser um array de lookups
function getLookupValue(field) {
  if (Array.isArray(field) && field.length > 0) {
    // Retorna o primeiro elemento não-nulo
    return field[0] !== null && field[0] !== undefined ? field[0] : "";
  }
  return "";
}


// ============================================================
// 💌 Função auxiliar – Envio de e-mail ao DOADOR (EmailJS)
// ============================================================
async function enviarEmailDoador(params) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID_DOADOR;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.error("⚠️ Variáveis EmailJS ausentes ou incorretas. Verifique EMAILJS_SERVICE_ID, etc.");
    return;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey, // Uso da chave privada no modo server-side
    template_params: {
      to_name: params.nome_doador || "Doador",
      to_email: params.email_doador || "",
      child_name: params.nome_crianca || "",
      child_age: params.idade_crianca || null,
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      pickup_map_url: params.ponto_coleta?.mapa_url || "",
      // Dados de gamificação
      gami_level: params.gami_level || 1,
      gami_points: params.gami_points || 10,
      gami_badge_title: params.gami_badge_title || "💙 Iniciante Solidário",
      gami_next_goal:
        params.gami_next_goal || "Adote mais uma cartinha para subir de nível!",
      // Informações complementares (prazo e código)
      deadline: params.deadline || "Verificar na plataforma",
      order_id: params.order_id || "N/A",
    },
  };

  console.log("📦 Enviando payload EmailJS...");

  try {
    const emailResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const respText = await emailResp.text();
    console.log("📧 Resposta EmailJS:", emailResp.status, respText);

    if (!emailResp.ok) throw new Error(respText);
    console.log("✅ E-mail de confirmação enviado ao doador.");
  } catch (err) {
    console.error("🔥 Erro ao enviar e-mail ao doador:", err.message);
  }
}

// ============================================================
// 🎮 Função Central — Atualização de Gamificação
// ============================================================
async function atualizarGamificacao(base, idUsuario, nomeDoador) {
  let gamiData = {
    gami_level: 1,
    gami_points: 10,
    gami_badge_title: "💙 Iniciante Solidário",
    gami_next_goal: "Adote 2 cartinhas para o próximo nível.",
  };

  try {
    // 1️⃣ Busca regras e gamificação atual
    const [regrasResp, doadorResp] = await Promise.all([
      base("regras_gamificacao")
        .select({ sort: [{ field: "faixa_adocoes_min", direction: "asc" }] })
        .all(),
      base("gamificacao")
        .select({ filterByFormula: `{id_usuario}='${idUsuario}'` })
        .all(),
    ]);
    
    // ⚠️ Ponto de correção: Garante que regrasResp é um array antes de mapear
    const regras = Array.isArray(regrasResp) ? regrasResp.map((r) => r.fields) : [];
    
    // Filtra regras válidas e com valor mínimo definido
    const regrasValidas = regras.filter(r => r.faixa_adocoes_min !== undefined && r.faixa_adocoes_min !== null);

    if (regrasValidas.length === 0) {
        console.warn("⚠️ Nenhuma regra de gamificação válida encontrada. Pulando atualização.");
        return gamiData;
    }

    const registroExistente = doadorResp[0];
    const pontosAtuais = registroExistente?.fields?.pontos_coracao || 0;
    const adocoesAtuais = registroExistente?.fields?.total_cartinhas_adotadas || 0;
    const idRegistro = registroExistente?.id;

    // 2️⃣ Cálculo de pontos e adoções
    const novosPontos = pontosAtuais + 10;
    const novasAdocoes = adocoesAtuais + 1;

    // 3️⃣ Determina nível e próxima meta
    // Encontra a regra máxima atingida (a que tem a maior faixa_adocoes_min <= novasAdocoes)
    let nivelAtual = regrasValidas.reduce((maxRule, currentRule) => {
        if (novasAdocoes >= currentRule.faixa_adocoes_min && 
            currentRule.faixa_adocoes_min > (maxRule?.faixa_adocoes_min || -1)) {
            return currentRule;
        }
        return maxRule;
    }, regrasValidas[0]); // Começa com a regra base (geralmente nível 1/0 adoções)

    // Garante que nivelAtual não seja nulo (fallback para a regra de menor requisito, geralmente o Nível 1)
    if (!nivelAtual) {
        nivelAtual = regrasValidas[0];
    }
    
    // A próxima meta é a regra com o menor requisito > novasAdocoes
    const regrasFuturas = regrasValidas.filter(r => r.faixa_adocoes_min > novasAdocoes);
    let metaProxima = regrasFuturas.length > 0
        ? regrasFuturas.reduce((min, current) => 
            (current.faixa_adocoes_min < min.faixa_adocoes_min ? current : min), regrasFuturas[0])
        : null;


    gamiData = {
      gami_level: nivelAtual.nivel_gamificacao || 1,
      gami_points: novosPontos,
      gami_badge_title: nivelAtual.titulo_conquista || "💙 Iniciante Solidário",
      gami_next_goal: metaProxima
        ? `Adote mais ${
            metaProxima.faixa_adocoes_min - novasAdocoes
          } cartinha(s) para atingir o nível ${
            metaProxima.nivel_gamificacao
          } (${metaProxima.titulo_conquista})!`
        : "Você atingiu o nível máximo! 🌟",
    };

    // 4️⃣ Atualiza ou cria registro
    const campos = {
      id_usuario: [idUsuario],
      pontos_coracao: novosPontos,
      total_cartinhas_adotadas: novasAdocoes,
      nivel_atual: nivelAtual.nivel_gamificacao,
      titulo_conquista: nivelAtual.titulo_conquista,
      ultima_atualizacao: new Date().toISOString(),
      // Se for criar um novo registro, inclua o nome do doador
      ...(idRegistro ? {} : { nome_usuario: nomeDoador })
    };

    if (idRegistro) {
      await base("gamificacao").update([{ id: idRegistro, fields: campos }]);
      console.log(`✅ Gamificação atualizada para ${idUsuario}`);
    } else {
      await base("gamificacao").create([{ fields: campos }]);
      console.log(`✅ Novo registro de gamificação criado (${idUsuario})`);
    }
  } catch (err) {
    console.error("⚠️ Erro catastrófico na gamificação. Operação ignorada:", err.message, err.stack);
    // Retorna os dados padrão para que o e-mail não quebre.
    return gamiData; 
  }

  return gamiData;
}

// ============================================================
// 🧩 HTML auxiliar para a página de sucesso/erro (para requisições GET)
// ============================================================
function getSuccessPageHTML(message, color) {
  const adminUrlFallback = "/pages/admin.html";
  const appBaseUrl = process.env.APP_BASE_URL || "";
  const redirectUrl = appBaseUrl ? `${appBaseUrl}/pages/admin.html` : adminUrlFallback;
  
  return `
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Confirmação da Adoção</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
          body { font-family:'Poppins',sans-serif; background:#f0f7ff; text-align:center; padding:50px; color:#123456; }
          .card { background:#fff; border-radius:16px; display:inline-block; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,.08); max-width: 400px; width: 90%; }
          h1 { color:${color}; margin-bottom:10px; font-size: 24px; font-weight: 800; }
          p { font-size:16px; margin-bottom: 25px; }
          a { background:${color}; color:#fff; text-decoration:none; padding:10px 18px; border-radius:24px; font-weight:600; display:inline-block; margin-top:10px; transition: background 0.3s; }
          a:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${message}</h1>
          <p>Você pode fechar esta página ou voltar ao painel de administração.</p>
          <a href="${redirectUrl}">Voltar ao Painel</a>
        </div>
      </body>
    </html>
  `;
}


// ============================================================
// 🧩 Handler Principal
// ============================================================
export default async function handler(req, res) {
  // Configurações de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();


  const id_adocao = req.query.id_adocao || req.body?.id_adocao;
  if (!id_adocao)
    return res.status(400).json({ sucesso: false, mensagem: "ID da adoção ausente." });

  try {
    // 0️⃣ Configuração Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // 1️⃣ Busca Registro da Adoção
    let registro;
    try {
        registro = await base("adocoes").find(id_adocao);
    } catch (error) {
        console.error("🔥 Erro ao buscar ID da adoção:", error);
        return res.status(404).json({ sucesso: false, mensagem: "Adoção não encontrada." });
    }
    const f = registro.fields;
    
    // 1.1) Verifica se a adoção já está confirmada
    if (f.status_adocao === "confirmada") {
      console.log(`⚠️ Adoção ${id_adocao} já estava confirmada. Pulando ações.`);
      if (req.method === "GET") {
        return res.status(200).send(getSuccessPageHTML("Adoção já estava confirmada. (Nada foi alterado)", "#ffc107"));
      }
      return res.status(200).json({ sucesso: true, mensagem: "Adoção já estava confirmada." });
    }


    // 2️⃣ Atualiza status da adoção
    await base("adocoes").update([
      { id: id_adocao, fields: { status_adocao: "confirmada" } },
    ]);
    console.log(`✅ Adoção ${id_adocao} confirmada.`);

    // 3️⃣ Extrai IDs e dados (Usando a função de tratamento de Lookup)
    // IDs
    const idUsuario = getLookupValue(f.nome_usuario);
    // const idCartinha = getLookupValue(f.nome_crianca); // Não é usado aqui, pode ser removido ou mantido
    
    // Dados do Doador
    const emailDoador = getLookupValue(f["email_usuario (from nome_usuario)"]);
    const nomeDoador = getLookupValue(f["nome_usuario (from nome_usuario)"]);

    // Dados da Cartinha
    const childName = getLookupValue(f["nome_crianca (from nome_crianca)"]);
    const childGift = getLookupValue(f["sonho (from nome_crianca)"]);
    // ⚠️ Ponto de correção: Usa getLookupValue para idade
    const childAge = getLookupValue(f["idade (from nome_crianca)"]); 
    const deadline = f.data_limite_recebimento || 'Verificar na plataforma'; 
    
    // 4️⃣ Busca ponto de coleta
    let pontoColeta = { nome: "", endereco: "", telefone: "", mapa_url: "" };
    const relPonto = Array.isArray(f.pontos_coleta) ? f.pontos_coleta[0] : null;

    if (relPonto) {
      try {
        const ponto = await base("pontos_coleta").find(relPonto);
        pontoColeta = {
          nome: ponto.get("nome_ponto") || "",
          endereco: ponto.get("endereco") || "",
          telefone: ponto.get("telefone") || "",
          mapa_url: `https://maps.google.com/maps?q=${encodeURIComponent(
            ponto.get("endereco") || ""
          )}`,
        };
      } catch (errPonto) {
        console.warn("⚠️ Falha ao buscar ponto de coleta:", errPonto);
      }
    }

    // 5️⃣ Atualiza gamificação
    let gamificacaoData = {};
    if (idUsuario) {
        // Passando o nome do doador caso seja necessário criar o registro de gamificação
        gamificacaoData = await atualizarGamificacao(base, idUsuario, nomeDoador);
    } else {
        console.warn("⚠️ Nenhum ID de doador encontrado para gamificação.");
    }

    // 6️⃣ Envia e-mail de confirmação
    if (emailDoador) {
      await enviarEmailDoador({
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: childName,
        idade_crianca: childAge, 
        sonho: childGift,
        ponto_coleta: pontoColeta,
        deadline: deadline,
        order_id: id_adocao, 
        ...gamificacaoData,
      });
    } else {
      console.warn("⚠️ Nenhum e-mail de doador encontrado. Adoção confirmada, mas e-mail não enviado.");
    }
    
    // 7️⃣ Página de retorno (modo GET)
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(getSuccessPageHTML("Adoção Confirmada com Sucesso! 💙", "#1f6fe5"));
    }

    return res
      .status(200)
      .json({ sucesso: true, mensagem: "Adoção confirmada e e-mail enviado." });
  } catch (error) {
    console.error("🔥 Erro fatal /api/confirmar:", error);
    // Página de erro (modo GET)
    if (req.method === "GET") {
      return res.status(500).send(getSuccessPageHTML("Erro interno ao confirmar adoção. Verifique os logs e variáveis de ambiente.", "#dc3545"));
    }
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno ao confirmar adoção." });
  }
}