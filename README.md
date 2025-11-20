# 💙 Varal dos Sonhos
### Plataforma Web para Gestão de Doações e Conexão Solidária

<div align="center">
  <img src="./imagens/logo.png" width="210" alt="Logo Fantástica Fábrica de Sonhos">
</div>

Acesse a plataforma: **https://varaldossonnhos2-0.vercel.app/**

Acesso ao Painel Administrativo:  
**Login:** varaldossonhossp@gmail.com  
**Senha:** varaladmin  

---

# 📑 Índice

1. [Descrição Geral do Projeto (TCC)](#-descrição-geral-do-projeto-tcc)  
2. [Diferenciais do Projeto](#-diferenciais-do-projeto)  
3. [Plataforma SaaS – Multi-ONG](#-plataforma-saas--multi-ong)  
4. [Arquitetura Geral do Projeto](#-arquitetura-geral-do-projeto)  
5. [Modelagem das Tabelas (Airtable)](#️-modelagem-das-tabelas-airtable)  
6. [Principais APIs](#-principais-apis)  
7. [Fluxo Completo do Sistema](#-fluxo-completo-do-sistema)  
8. [Tecnologias Utilizadas](#-tecnologias-utilizadas)  
9. [Mockups do Projeto](#️-mockups-do-projeto)  
10. [Autores](#-autores)  
11. [Licença](#-licença)

---

# 🎓 Descrição Geral do Projeto (TCC)

O **Varal dos Sonhos** é uma plataforma web completa e integrada, desenvolvida como TCC, projetada para organizar, automatizar e facilitar todo o processo de adoção de cartinhas, desde a escolha da criança até a logística final da entrega. Além disso, inclui módulos de gestão de eventos, administração do sistema e personalização visual, tornando-se uma solução moderna e profissional para instituições sociais.

A plataforma reúne:

- 🌐 Front-end responsivo  
- 🔧 Back-end com APIs serverless  
- 🗄️ Banco Airtable  
- 🖥️ Painel Administrativo completo  
- 📬 Fluxo automatizado de e-mails  
- 🚚 Logística de doações  
- ☁️ Mascote oficial: **Cloudinho**

---

# 🌟 Diferenciais do Projeto

Este TCC entrega um **sistema real**, completo e multi-módulo muito além do comum.

## 1. Plataforma Completa e Modular
Inclui:
- Front-end profissional  
- APIs separadas  
- Fluxo completo de adoção  
- Logística integrada  
- Painel administrativo  
- Upload de imagens  
- E-mail automático  
- Design moderno  

## 2. Mascote Cloudinho — Experiência Humanizada
<div align="center">
  <img src="./imagens/cloudinho.png" width="180" alt="Cloudinho mascote">
</div>

Cloudinho:
- ajuda na navegação  
- acolhe o usuário  
- reforça a identidade visual  
- cria conexão emocional  

## 3. Varal Virtual Interativo
- Cartinhas suspensas por pregadores  
- Layout temático  
- Cards animados  
- Zoom da cartinha  
- Botão de adoção dinâmico  
- Filtragem pelo status real da cartinha  

## 4. Fluxo Logístico Completo – Diferencial Raro
Fluxo completo:
1. Seleção da cartinha  
2. Adoção  
3. Escolha do ponto de coleta  
4. E-mail ao doador  
5. E-mail ao ponto de coleta  
6. Recebimento  
7. Conferência  
8. Entrega final  
9. Histórico no Airtable  

## 5. Envio Automático de E-mails
Com EmailJS:
- confirmação da adoção  
- alerta ao ponto de coleta  
- dados completos da entrega  

## 6. Painel Administrativo
Permite gerenciar:
- eventos  
- pontos de coleta  
- cartinhas  
- adoções  
- configurações gerais do site  
- destaque de eventos na home  

## 7. Gestão de Eventos com Galeria
- nome  
- descrição  
- local  
- fotos  
- status  
- destaque  
- vinculação de cartinhas  

## 8. Segurança e Boas Práticas
- Variáveis no `.env`  
- Tokens protegidos  
- API separada do front  
- LGPD friendly  

## 9. Banco Airtable
- moderno  
- visual  
- intuitivo  
- ideal para voluntários  

---

# ⭐ Plataforma SaaS – Multi-ONG

Uma das maiores evoluções do sistema é a criação do **módulo de Configuração Geral do Site**, que transformou o projeto em uma **plataforma SaaS (Software as a Service)**.

Isso significa que **qualquer ONG pode usar o Varal dos Sonhos** com sua própria identidade visual.

### O admin pode configurar:
- Nome da ONG  
- Descrição  
- Logo da ONG  
- Nuvem animada da homepage  
- Instagram  
- E-mail e telefone  
- Textos da homepage  

Essas informações são salvas na tabela `config_site` e aplicadas dinamicamente pelo script:

🔹 **Sem necessidade de programador.**  
🔹 **Sem editar código.**  
🔹 **Personalização instantânea.**

Com isso, o Varal dos Sonhos 2.0 torna-se um sistema:

✔ escalável  
✔ replicável  
✔ multi-ong  
✔ sustentável  

---

# 🧩 Arquitetura Geral do Projeto

### **Back-end – /api/**
- usuarios.js  
- cartinha.js  
- adocoes.js  
- eventos.js  
- pontosdecoleta.js  
- admin.js  
- config-site.js  
- gamificacao.js  
- regras_gamificacao.js  
- email.js  

### **Front-end – /js/**
- componentes.js  
- config-site-apply.js  
- cloudinho.js  
- cartinha.js  
- carrinho.js  
- eventos.js  
- pontos.js  
- logistica.js  

### **Outros diretórios**
- **css/**  
- **imagens/**  
- **componentes/**  
- **pages/**  
- **vercel.json**  

---

# 🗄️ Modelagem das Tabelas (Airtable)

| Tabela | Função | Campos |
|--------|--------|--------|
| **usuarios** | Cadastro/login | nome, email, telefone, senha |
| **cartinha** | Dados das crianças | nome, idade, sonho, sexo, evento, status, imagem |
| **adocoes** | Adoções | cartinha, usuario, ponto, data, status |
| **eventos** | Ações solidárias | nome, descrição, data, destaque, imagens |
| **pontos_coleta** | Logística | nome, endereço, responsável, e-mail |
| **config_site** | SaaS visual | logo, nuvem, instagram, contato |
| **gamificacao** | Pontos | usuário, pontuação |
| **regras_gamificacao** | Regras | ação, XP |

---

# ⚙️ Principais APIs

### `/api/usuarios.js`
Cadastro, login e validação.

### `/api/cartinha.js`
Listagem, criação, edição e filtro automático por status.

### `/api/adocoes.js`
Cadastro da adoção, e-mail e atualização da cartinha para *adotada*.

### `/api/eventos.js`
CRUD de eventos.

### `/api/pontosdecoleta.js`
Listagem e controle.

### `/api/admin.js`
Gerencia o módulo SaaS + eventos (token protegido).

---

# 🔄 Fluxo Completo do Sistema

1. Usuário acessa a Home  
2. Escolhe um evento  
3. Entra no Varal Virtual  
4. Seleciona uma cartinha  
5. Finaliza a adoção  
6. API salva tudo  
7. E-mails são enviados  
8. Logística recebe  
9. Admin confirma entrega  
10. Registro histórico no Airtable  

---

# 🧰 Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-------------|
| Front-end | HTML, CSS, JavaScript |
| Back-end | Node.js (Serverless) |
| Banco | Airtable |
| Hospedagem | Vercel |
| E-mails | EmailJS, Mailjet |
| Upload | Cloudinary |
| UX | Cloudinho Mascote |

---

# 🖼️ Mockups do Projeto

*(As imagens abaixo representam o design e os fluxos principais.)*

## 🏠 Tela Inicial  
<img width="1365" height="600" alt="image" src="https://github.com/user-attachments/assets/14261c94-9c5e-4c4a-adad-f8b1608864cf" />

## 💌 Varal Virtual  
<img width="1361" height="604" alt="image" src="https://github.com/user-attachments/assets/b0a8cc63-1052-4fbe-ab04-925e640f9789" />

## 📦 Pontos de Coleta
<img width="1365" height="598" alt="image" src="https://github.com/user-attachments/assets/cece42d1-5fdc-4ffe-b370-58bf1f57ad55" />

## 📝 Cadastro  
<img width="1361" height="601" alt="image" src="https://github.com/user-attachments/assets/ea45e983-df2b-4e4a-9143-ffdd504024b7" />

## 💙 Adoção  (Carrinho)
<img width="1200" height="600" alt="image" src="https://github.com/user-attachments/assets/3a1d2212-c38c-41ac-b4dc-d4398733e785" />

## ⚙️ Painel Admin  
<img width="1365" height="601" alt="image" src="https://github.com/user-attachments/assets/c9bde05f-8229-443f-9c89-958bc10ce866" />
<br>
<img width="1365" height="598" alt="image" src="https://github.com/user-attachments/assets/bd90196b-ebdd-4a5b-9626-b244d46573f0" />

## 🗂️ Relatórios com Filtro e pdf 
<img width="891" height="592" alt="image" src="https://github.com/user-attachments/assets/1d33514b-1757-45bd-b7e7-4aa13c96a4ff" />
<br>
<img width="1003" height="617" alt="image" src="https://github.com/user-attachments/assets/ad8683ea-1d68-4e01-b5b2-a17b8033e616" />

## 🚚 Painel de Logística  
<img width="1363" height="502" alt="image" src="https://github.com/user-attachments/assets/4d19290b-5894-4a04-ab2d-ba6084d05fa6" />

## ⚙️ Módulo SaaS - Configuração do Site 
<img width="683" height="599" alt="image" src="https://github.com/user-attachments/assets/928af329-41e0-40e0-b037-54d1e10f77c8" />
<br>
<img width="814" height="535" alt="image" src="https://github.com/user-attachments/assets/68321eb4-9d23-4d8e-a172-36bb22c0df26" />
<br>
<img width="597" height="603" alt="image" src="https://github.com/user-attachments/assets/409c443b-5788-429d-86fb-e5361e258a17" />

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
Proibido uso comercial sem autorização da autora.

---

<div align="center">

### 💙 *“Sonhar é plantar esperança. Realizar é transformar vidas.”*  
**Varal dos Sonhos 2.0 — Fantástica Fábrica de Sonhos**

</div>


