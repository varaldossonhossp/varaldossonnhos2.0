// ============================================================
// 💙 VARAL DOS SONHOS — /api/confirmar.js (versão final TCC)
// ------------------------------------------------------------
// Este endpoint é responsável por:
// • Confirmar uma adoção (alterando o status para "confirmada")
// • Enviar o e-mail de confirmação ao doador (via EmailJS)
// • Atualizar automaticamente a pontuação e o nível de gamificação
//   do usuário (na tabela "gamificacao" do Airtable)
// ------------------------------------------------------------
// Tabelas envolvidas:
//   - adocoes
//   - usuario
//   - cartinha
//   - pontos_coleta
//   - gamificacao
//   - regras_gamificacao
// ============================================================

import Airtable from "airtable";

// Configuração do ambiente de execução (Node.js)
export const config = { runtime: "nodejs" };

// ============================================================
// 💌 Função auxiliar — Envio de e-mail ao DOADOR
// ------------------------------------------------------------
// Esta função utiliza o serviço EmailJS para enviar ao doador
// uma mensagem personalizada de confirmação contendo os dados
// da adoção, do ponto de coleta e da sua pontuação de gamificação.
// ============================================================
async function enviarEmailDoador(params) {
  // 🔐 Carrega as variáveis de ambiente (segurança no servidor)
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID_DOADOR;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  // Validação das variáveis obrigatórias
  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.error("⚠️ Variáveis EmailJS ausentes ou incorretas.");
    return;
  }

  // Estrutura do payload enviado à API do EmailJS
  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey, // Uso da chave privada no modo server-side
    template_params: {
      to_name: params.nome_doador || "Doador",
      to_email: params.email_doador || "",
      child_name: params.nome_crianca || "",
      child_gift: params.sonho || "",
      pickup_name: params.ponto_coleta?.nome || "",
      pickup_address: params.ponto_coleta?.endereco || "",
      pickup_phone: params.ponto_coleta?.telefone || "",
      pickup_map_url: params.ponto_coleta?.mapa_url || "",
      // Dados de gamificação incorporados no corpo do e-mail
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
    // Disparo do e-mail via requisição HTTP
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
// 🎮 Função central — Atualização de Gamificação
// ------------------------------------------------------------
// Esta função consulta as regras de gamificação no Airtable,
// incrementa pontos e níveis conforme a quantidade de adoções
// confirmadas, e atualiza (ou cria) o registro do doador.
// ============================================================
async function atualizarGamificacao(base, idUsuario) {
  // Valores padrão para usuários novos
  let gamiData = {
    gami_level: 1,
    gami_points: 10,
    gami_badge_title: "💙 Iniciante Solidário",
    gami_next_goal: "Adote 2 cartinhas para o próximo nível.",
  };

  try {
    // Busca simultânea das regras e dos dados do doador
    const [regrasResp, doadorResp] = await Promise.all([
      base("regras_gamificacao")
        .select({ sort: [{ field: "faixa_adocoes_min", direction: "asc" }] })
        .all(),
      base("gamificacao")
        .select({ filterByFormula: `{id_usuario}='${idUsuario}'` })
        .all(),
    ]);

    const regras = regrasResp.map((r) => r.fields);
    const registroExistente = doadorResp[0];

    // Pontos e adoções atuais
    const pontosAtuais = registroExistente?.fields?.pontos_coracao || 0;
    const adocoesAtuais = registroExistente?.fields?.total_cartinhas_adotadas || 0;
    const idRegistro = registroExistente?.id;

    // Incrementa pontos e adoções
    const novosPontos = pontosAtuais + 10;
    const novasAdocoes = adocoesAtuais + 1;

    // Determina o nível atual e o próximo objetivo
    let nivelAtual = regras[0];
    let metaProxima = regras[1];
    for (let i = 0; i < regras.length; i++) {
      if (novasAdocoes >= regras[i].faixa_adocoes_min) {
        nivelAtual = regras[i];
        metaProxima = regras[i + 1] || null;
      }
    }

    // Monta dados atualizados para salvar e para o e-mail
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

    // Atualiza ou cria o registro do usuário no Airtable
    const campos = {
      id_usuario: [idUsuario],
      pontos_coracao: novosPontos,
      total_cartinhas_adotadas: novasAdocoes,
      nivel_atual: nivelAtual.nivel_gamificacao,
      titulo_conquista: nivelAtual.titulo_conquista,
      ultima_atualizacao: new Date().toISOString(),
    };

    if (idRegistro) {
      await base("gamificacao").update([{ id: idRegistro, fields: campos }]);
      console.log(`✅ Gamificação atualizada para ${idUsuario}`);
    } else {
      await base("gamificacao").create([{ fields: campos }]);
      console.log(`✅ Novo registro de gamificação criado (${idUsuario})`);
    }
  } catch (err) {
    console.error("⚠️ Erro na gamificação:", err.message);
  }

  return gamiData;
}

// ============================================================
// 🧩 Handler Principal — Função executada ao acessar a rota
// ------------------------------------------------------------
// Este handler é chamado quando o administrador clica no botão
// de confirmação do e-mail. Ele valida o ID da adoção, atualiza
// o status no Airtable, recalcula a gamificação e envia o e-mail
// de confirmação ao doador.
// ============================================================
export default async function handler(req, res) {
  // Configurações de CORS para acesso público seguro
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Captura o ID da adoção via query ou corpo da requisição
  const id_adocao = req.query.id_adocao || req.body?.id_adocao;
  if (!id_adocao)
    return res.status(400).json({ sucesso: false, mensagem: "ID da adoção ausente." });

  try {
    // Conexão com o Airtable usando as credenciais do ambiente
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // Busca o registro da adoção
    const registro = await base("adocoes").find(id_adocao);
    const f = registro.fields;

    // 🛑 Verifica se já está confirmada
    if (f.status_adocao === "confirmada") {
      console.log(`⚠️ Adoção ${id_adocao} já estava confirmada. Pulando ações.`);
      if (req.method === "GET") {
        return res.status(200).send(getSuccessPageHTML("Adoção já estava confirmada.", "#ffc107"));
      }
      return res.status(200).json({ sucesso: true, mensagem: "Adoção já estava confirmada." });
    }

    // 1️⃣ Atualiza status da adoção
    await base("adocoes").update([
      { id: id_adocao, fields: { status_adocao: "confirmada" } },
    ]);
    console.log(`✅ Adoção ${id_adocao} confirmada.`);

    // 2️⃣ Extrai dados principais (usuário, criança, presente)
    const idUsuario = Array.isArray(f.nome_usuario) ? f.nome_usuario[0] : null;
    const emailDoador = f["email_usuario (from nome_usuario)"]?.[0] || "";
    const nomeDoador = f["nome_usuario (from nome_usuario)"]?.[0] || "";
    const childName = f["nome_crianca (from nome_crianca)"]?.[0] || "";
    const childGift = f["sonho (from nome_crianca)"]?.[0] || "";
    const deadline = f.data_limite_recebimento || "Verificar na plataforma";

    // 3️⃣ Busca informações do ponto de coleta
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

    // 4️⃣ Atualiza a gamificação do doador
    let gamificacaoData = {};
    if (idUsuario) gamificacaoData = await atualizarGamificacao(base, idUsuario);

    // 5️⃣ Envia o e-mail de confirmação ao doador
    if (emailDoador) {
      await enviarEmailDoador({
        nome_doador: nomeDoador,
        email_doador: emailDoador,
        nome_crianca: childName,
        sonho: childGift,
        ponto_coleta: pontoColeta,
        deadline: deadline,
        order_id: id_adocao,
        ...gamificacaoData,
      });
    } else {
      console.warn("⚠️ Nenhum e-mail de doador encontrado.");
    }

    // 6️⃣ Retorno visual (modo GET → ao clicar no e-mail)
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(getSuccessPageHTML("Adoção Confirmada com Sucesso! 💙", "#1f6fe5"));
    }

    // Retorno padrão em JSON
    return res.status(200).json({
      sucesso: true,
      mensagem: "Adoção confirmada e e-mail enviado.",
    });
  } catch (error) {
    console.error("🔥 Erro /api/confirmar:", error);

    // Tratamento de erro com página de feedback
    if (req.method === "GET") {
      return res
        .status(500)
        .send(getSuccessPageHTML("Erro ao confirmar adoção. Verifique os logs.", "#dc3545"));
    }
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao confirmar adoção." });
  }
}

// ============================================================
// 🖼️ Função auxiliar — Página HTML de Sucesso ou Erro
// ------------------------------------------------------------
// Esta função gera a página exibida no navegador do administrador
// após a confirmação da adoção. Usa cores diferentes conforme o
// resultado (sucesso, alerta, erro) e mantém o padrão visual do site.
// ============================================================
function getSuccessPageHTML(message, color) {
  const adminUrlFallback = "/pages/admin.html"; // Caminho genérico de fallback
  const appBaseUrl = process.env.APP_BASE_URL || "";
  const redirectUrl = appBaseUrl
    ? `${appBaseUrl}/pages/admin.html`
    : adminUrlFallback;

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
