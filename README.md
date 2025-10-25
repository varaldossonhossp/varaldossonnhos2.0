<!-- ============================================================ -->
<!-- 💙 README — VARAL DOS SONHOS 2.0 -->
<!-- ============================================================ -->

<div align="center">

# 💙 Fantástica Fábrica de Sonhos — Varal dos Sonhos 2.0

<img src="./imagens/logo.png" width="180" alt="Fantástica Fábrica de Sonhos">

> Plataforma solidária para adoção de cartinhas de Natal e realização de sonhos de crianças.

[![Deploy Vercel](https://img.shields.io/badge/deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Airtable](https://img.shields.io/badge/Database-Airtable-blue?style=for-the-badge&logo=airtable)](https://airtable.com)
[![JavaScript](https://img.shields.io/badge/Front--End-JavaScript-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/API-Node.js-green?style=for-the-badge&logo=node.js)](https://nodejs.org)

</div>

---

## 🌈 **Visão Geral**

**Varal dos Sonhos 2.0** é um sistema web desenvolvido com foco em **solidariedade, transparência e inclusão**.  
A plataforma permite que usuários **adotem cartinhas de crianças**, acompanhem eventos sociais e colaborem com doações.  
Inspirada em um “varal de cartinhas”, a interface traz leveza e acessibilidade, simbolizando a magia de transformar sonhos em realidade.  

💭 *“Cada cartinha é uma janela para o sonho de uma criança.”*

---

## 🧩 **Arquitetura do Projeto**

varaldossonhos2.0/
│
├── api/ → Camada de integração com o Airtable (Back-End)
│ ├── admin.js → Rotas do painel administrativo (eventos + galeria)
│ ├── adocoes.js → Registra adoções e atualiza status das cartinhas
│ ├── cadastro.js → Criação de novos usuários
│ ├── cartinhas.js → Lista cartinhas disponíveis para adoção
│ ├── cloudinho.js → Endpoint do assistente virtual Cloudinho
│ ├── login.js → Autenticação de usuários
│ ├── pontosDeColeta.js → Listagem dos pontos de coleta
│ ├── gamificacao.js → Sistema de pontuação e ranking (futuro)
│ └── lib/
│ └── enviarEmail.js → Integração com EmailJS
│
├── componentes/ → Componentes reutilizáveis de interface
│ ├── header.html
│ ├── footer.html
│ └── cloudinho.html
│
├── css/ → Folhas de estilo modulares
│ ├── style.css → Estilo global (home)
│ ├── cartinhas.css → Estilo do varal de cartinhas
│ ├── varal.css → Animações do varal
│ ├── header.css / footer.css / cloudinho.css
│ └── carrinho.css
│
├── js/ → Scripts de interação e integração
│ ├── admin.js → Painel administrativo
│ ├── cartinhas.js → Monta e anima o varal das cartinhas
│ ├── carrossel.js → Exibe eventos em carrossel automático
│ ├── varal.js → Efeitos de balanço das cartinhas
│ ├── cloudinho.js → Mascote interativo
│ ├── header.js / footer.js → Carregamento dinâmico de componentes
│ └── galeria.js / carrinho.js
│
├── imagens/ → Logos, cartinhas, ícones e mascotes
│
├── pages/ → Páginas estáticas
│ ├── index.html → Página inicial (home)
│ ├── cartinhas.html → Varal virtual das cartinhas
│ ├── carrinho.html → Carrinho de adoções
│ └── admin.html → Painel administrativo
│
├── .env.local → Variáveis de ambiente (Airtable, EmailJS, ADMIN_SECRET)
├── .gitignore
├── vercel.json → Configuração do deploy
└── README.md


---

## 🧠 **Fluxo de Funcionamento**

### 🩵 1. **Usuário (Front-End)**
- Acessa o site e visualiza as **cartinhas disponíveis** no varal;
- Cada cartinha contém:
  - Nome da criança;
  - Idade;
  - Sexo;
  - Sonho;
  - Foto e botão de adoção;
- Ao clicar em “Adotar”, os dados são enviados à API `/api/adocoes`.

### ⚙️ 2. **API (Back-End)**
- Recebe os dados via **fetch** e grava no **Airtable** (tabela `adocoes`);
- Atualiza automaticamente o campo `status` da cartinha para `"adotada"`;
- Envia um **e-mail de confirmação** via EmailJS.

### 🧩 3. **Administrador (Painel /api/admin.js)**
- Acessa o painel `pages/admin.html`;
- Gerencia **eventos e galeria**;
- Pode criar, atualizar ou excluir eventos que aparecem no carrossel da home.

---

## 🚀 **Caminho Feliz**

1. O visitante entra na **home** → `index.html`;
2. Visualiza os eventos e o mascote Cloudinho;
3. Clica em **“Varal Virtual”** → `pages/cartinhas.html`;
4. Escolhe uma cartinha e clica em **“Adotar”**;
5. A API `/api/adocoes` registra a adoção e muda o status;
6. O administrador confirma a entrega no painel `/pages/admin.html`;
7. Tudo fica registrado no **Airtable** de forma sincronizada.

---

## 🔒 **Segurança e Privacidade**

- Todas as chaves e tokens estão armazenados no `.env.local`;
- O acesso administrativo requer `ADMIN_SECRET` no corpo da requisição;
- Dados sensíveis nunca são expostos no front-end;
- Projeto compatível com **LGPD** e boas práticas de segurança.

---

## 🧰 **Tecnologias Utilizadas**

| Camada | Tecnologia |
|--------|-------------|
| **Front-End** | HTML5, CSS3, JavaScript Vanilla |
| **Back-End (APIs)** | Node.js + Airtable SDK |
| **Banco de Dados** | Airtable (tabelas: cartinhas, adocoes, eventos, pontos_coleta) |
| **Envio de E-mails** | EmailJS |
| **Hospedagem** | Vercel (Serverless Functions) |
| **Gerenciamento de Configurações** | `.env.local` + Gitignore |
| **Mascote Virtual** | Cloudinho (HTML + CSS + JS animado) |

---

💫 Autores e Créditos

👩‍💻 Desenvolvido por:
Carina da Silva Freire
Carina de Paula Mendes
Celso Gonçalves
Weverton Eleoterio Costa de Jesus

🎨 Identidade visual:
Mascote Cloudinho e tema gráfico “Fantástica Fábrica de Sonhos”

📜 Licença

Este projeto é de uso educacional e filantrópico.
A redistribuição comercial é proibida sem autorização da autora.

<div align="center">

💙 “Sonhar é o primeiro passo. Realizar é o mais bonito deles.”
✨ Varal dos Sonhos 2.0 — Fantástica Fábrica de Sonhos

</div> ```
