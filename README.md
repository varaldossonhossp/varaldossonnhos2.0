# 💙 Fantástica Fábrica de Sonhos — Varal dos Sonhos 
### Plataforma Web para Adoção de Cartinhas, Logística Solidária e Gestão de Eventos: 
### Acesse: https://varaldossonnhos2-0.vercel.app/
<br>
<div align="center">
  <img src="./imagens/logo.png" width="220" alt="Logo Fantástica Fábrica de Sonhos">
</div>

---

## 📑 Índice

1. [Descrição Geral do Projeto](#-descrição-geral-do-projeto-tcc)
2. [Diferenciais do Projeto](#-diferenciais-do-projeto)
   - [Plataforma Completa](#1-plataforma-completa-e-modular)
   - [Mascote Cloudinho](#2-mascote-cloudinho--experiência-humanizada)
   - [Varal Virtual Interativo](#3-varal-virtual-100-interativo)
   - [Fluxo Logístico Completo](#4-fluxo-logístico-completo-diferencial-raro-em-tccs)
   - [Envio Automático de E-mails](#5-envio-automático-de-e-mails)
   - [Painel Administrativo](#6-painel-administrativo-profissional)
   - [Gestão de Eventos](#7-gestão-de-eventos-com-galeria)
   - [Segurança](#8-segurança-e-boas-práticas)
   - [Banco Airtable](#9-banco-de-dados-airtable--rápido-visual-e-integrado)
   - [Gamificação](#10-gamificação-fase-futuro)
3. [Arquitetura do Projeto](#-arquitetura-geral-do-projeto)
4. [Modelagem das Tabelas](#-modelagem-das-tabelas-airtable)
5. [APIs Principais](#-principais-apis)
6. [Fluxo Completo do Sistema](#-fluxo-completo-do-sistema)
7. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
8. [Autores](#-autores)
9. [Licença](#-licença)

---

## 🎓 Descrição Geral do Projeto (TCC)

O **Varal dos Sonhos** é uma plataforma web desenvolvida como parte do **Trabalho de Conclusão de Curso (TCC)**, criada para **organizar, automatizar e facilitar** o processo de adoção de cartinhas de crianças atendidas por projetos sociais.

A solução une:

- 🌐 Front-end responsivo  
- 🔧 Back-end em APIs serverless  
- 🗄️ Banco Airtable integrado  
- 🧩 Painel administrativo profissional  
- 📬 Envio automático de e-mails  
- 🚚 Logística completa da entrega do presente  
- ☁️ Identidade visual com mascote oficial: **Cloudinho**

---

# 🌟 Diferenciais do Projeto

Este sistema vai muito além do típico TCC — ele entrega **um ecossistema completo**, com integrações reais e fluxos automatizados.

---

## 1. Plataforma Completa e Modular

Inclui:

- Front-end multi-páginas  
- APIs independentes  
- Banco de dados em nuvem  
- Painel administrativo  
- Logística completa  
- Envio de e-mails automático  
- Design exclusivo  

---

## 2. Mascote Cloudinho — Experiência Humanizada

<div align="center">
  <img src="./imagens/cloudinho.png" width="180" alt="Cloudinho - mascote oficial">
</div>

Cloudinho foi criado para:

- Interagir com usuários  
- Ajudar na navegação  
- Tornar o site acolhedor  
- Reforçar a identidade visual  
- Humanizar a ação social  

---

## 3. Varal Virtual 100% Interativo

- Cartinhas com animações  
- Pregadores animados  
- Fotos reais  
- Botão de adoção  
- API real puxando dados  
- Status sincronizado ao Airtable  
- Interface leve, acessível e encantadora  

---

## 4. Fluxo Logístico Completo (Diferencial Raro em TCCs)

Fluxo da doação:

1. Escolha da cartinha  
2. Adoção  
3. Seleção do ponto de coleta  
4. E-mail para doador  
5. E-mail para ponto de coleta  
6. Recebimento  
7. Conferência  
8. Entrega final  
9. Histórico no Airtable  

Totalmente automatizado.

---

## 5. Envio Automático de E-mails

- Confirmação da adoção  
- Aviso ao ponto de coleta  
- Templates padronizados  
- Dados completos da cartinha e do doador  
- Feito via EmailJS  

---

## 6. Painel Administrativo Profissional

O admin pode:

- Cadastrar eventos  
- Adicionar fotos  
- Atualizar status de cartinhas  
- Gerenciar entregas  
- Cadastrar pontos de coleta  
- Destacar eventos na homepage  

Protegido por `ADMIN_SECRET`.

---

## 7. Gestão de Eventos com Galeria

- Nome  
- Local  
- Descrição  
- Data  
- Status  
- Destaque  
- Fotos  
- Cartinhas vinculadas ao evento  

---

## 8. Segurança e Boas Práticas

- Variáveis no `.env.local`  
- Tokens não expostos  
- Arquitetura modular  
- LGPD friendly  
- API separada do front-end  

---

## 9. Banco de Dados Airtable — Rápido, Visual e Integrado

- Tabelas relacionadas  
- Histórico completo  
- Atualizações automáticas  
- Interface amigável para voluntários  
- Estrutura simples e robusta  

---

## 10. Gamificação 

- Pontos por ação  
- Níveis  
- Medalhas  
- Ranking  

---

# 🧩 Arquitetura Geral do Projeto

**Back-end (api/)**
- usuarios.js  
- cartinhas.js  
- adocoes.js  
- eventos.js  
- pontosdecoleta.js  
- admin.js  
- cloudinho.js  
- gamificacao.js  
- regras_gamificacao.js  
- Email.js  

**Front-end (js/)**
- header.js, footer.js, cloudinho.js  
- cartinhas.js, varal.js, carrossel.js  
- carrinho.js, pontosdecoleta.js, admin.js  

**Outros diretórios**
- **css/** – Estilos  
- **imagens/** – Logos, mascote e cartinhas  
- **componentes/** – Header, footer, cloudinho  
- **pages/** – Páginas HTML  
- **vercel.json** – Configuração do deploy  
- **README.md** – Documentação  
 
---

# 🗄️ Modelagem das Tabelas (Airtable)

| Tabela | Função | Campos Principais |
|--------|--------|-------------------|
| **usuarios** | Cadastro e login | nome, email, telefone, tipo, senha |
| **cartinhas** | Dados das crianças | nome_crianca, idade, sonho, sexo, imagem, evento, status |
| **adocoes** | Controle da adoção | id_usuario, id_cartinha, data, ponto, status |
| **eventos** | Gestão de ações | nome, descrição, local, imagens, status, destaque |
| **pontos_coleta** | Logística | nome_ponto, endereço, cidade, responsável, email |
| **gamificacao** | Pontuação | id_usuario, pontos, nivel |
| **regras_gamificacao** | Regras de XP | ação, pontos_atribuidos |

---

# ⚙️ Principais APIs

## `/api/usuarios.js`
Cadastro e login.

## `/api/cartinhas.js`
Listagem por evento e status.

## `/api/adocoes.js`
Registra adoção, envia e-mail e muda status.

## `/api/eventos.js`
CRUD de eventos.

## `/api/pontosdecoleta.js`
Lista pontos ativos.

## `/api/admin.js`
Funções restritas por secret.

---

# 🔄 Fluxo Completo do Sistema

1. Usuário acessa a home  
2. Visualiza eventos  
3. Entra no varal  
4. Escolhe cartinha  
5. Finaliza adoção  
6. API registra tudo  
7. E-mails enviados  
8. Logística atualizada  
9. Entrega final confirmada  

---

# 🧰 Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-------------|
| Front-end | HTML, CSS, JavaScript |
| Back-end | Node.js (Serverless) |
| Banco de dados | Airtable |
| E-mails | EmailJS, Mailjet |
| Hospedagem | Vercel |
| Upload | Cloudinary |
| Mascote | Cloudinho (HTML + CSS + JS) |

---
# 🖼️ Mockups do Projeto

A seguir, estão os mockups desenvolvidos para representar a identidade visual, usabilidade e fluxo do sistema **Varal dos Sonhos**.  
Eles ajudam a visualizar a experiência final do usuário antes da implementação.

---

## 🏠 Tela Inicial (Home)

<img width="1283" height="563" alt="image" src="https://github.com/user-attachments/assets/87ebdfee-cdaa-4988-a369-61c75490c265" />

---

## 💌 Varal Virtual de Cartinhas

<img width="1280" height="558" alt="image" src="https://github.com/user-attachments/assets/51bd0a79-2d4a-40e2-9bcf-cb908277db5a" />

---

## 📝 Tela de Cadastro

<img width="1352" height="598" alt="image" src="https://github.com/user-attachments/assets/20f9fc86-4edd-4039-a752-b72369d2e73b" />

---

## ❤️ Tela de Adoção (Carrinho)

<img width="1354" height="596" alt="image" src="https://github.com/user-attachments/assets/ae730328-213d-4fd8-86e2-67b18c05e791" />
<br>
<img width="1355" height="598" alt="image" src="https://github.com/user-attachments/assets/c91fd762-1ef7-4b25-960f-1e10a786b0b0" />

---

## ⚙️ Painel Administrativo

<img width="1365" height="602" alt="image" src="https://github.com/user-attachments/assets/5620a63e-26cf-4151-8f92-c0a458f70383" />
<br>
<img width="1365" height="599" alt="image" src="https://github.com/user-attachments/assets/f3cf1634-81f2-4210-8fb3-eb5931679232" />
<br>
<img width="1356" height="599" alt="image" src="https://github.com/user-attachments/assets/f56c4fcc-db41-49ed-95cb-6f1ff72dd019" />
<br>
<img width="1360" height="599" alt="image" src="https://github.com/user-attachments/assets/1eca37f3-a483-42ad-b1f3-d0ec75f78ec0" />
<br>

---

## 📅 Gestão de Eventos

<img width="832" height="600" alt="image" src="https://github.com/user-attachments/assets/61a7c434-24dc-4ffe-b313-1a8b6452a410" />
<br>
<img width="820" height="604" alt="image" src="https://github.com/user-attachments/assets/dc6cd3de-db11-443c-9bd1-ac3b1e01d7ec" />
<br>
<img width="1221" height="599" alt="image" src="https://github.com/user-attachments/assets/4dc645be-bafc-4f5d-a7d5-b9bc1eca9725" />
<br>
<img width="1161" height="604" alt="image" src="https://github.com/user-attachments/assets/61a9f4d8-3a16-48be-a879-9e07e9db5ef8" />

---

## 🗂️ Relatórios por filtros (visualização e .pdf)

<img width="781" height="589" alt="image" src="https://github.com/user-attachments/assets/875f770e-f5a9-44ff-b45e-3b5ca53f11f7" />
<br>
<img width="930" height="615" alt="image" src="https://github.com/user-attachments/assets/1d238456-e162-415a-a018-a558b736df98" />

---

## 🚚 Gerenciamento de Logística das Adoções pelo Admin

<img width="1359" height="597" alt="image" src="https://github.com/user-attachments/assets/30b44f04-4ca1-48f4-857b-7434f8e14d85" />
<br>
<img width="1348" height="600" alt="image" src="https://github.com/user-attachments/assets/72e01d4f-cc30-451f-9462-b9665909affe" />

---

## 🚚 Gerenciamento de Logística das Adoções pelo Ponto de Coleta

<img width="1365" height="598" alt="image" src="https://github.com/user-attachments/assets/0ae5c3e1-599f-42dd-a7bf-5d9947bd97c3" />

---

# 👩‍💻 Autores

- **Carina da Silva Freire**   
- **Carina de Paula Mendes**   
- **Celso Gonçalves**   
- **Erick Carvalho Holanda**
- **Weverton Eleotério** 

---

# 📜 Licença

Projeto de uso **educacional e filantrópico**.  
Uso comercial proibido sem autorização da autora.

---

<div align="center">

### 💙 *“Sonhar é plantar esperança. Realizar é transformar vidas.”*  
**Varal dos Sonhos 2.0 — Fantástica Fábrica de Sonhos**

</div>
