// ============================================================
// 👥 VARAL DOS SONHOS — /api/usuarios.js (Vercel Backend)
// ------------------------------------------------------------
// Cadastro e login de usuários (doador, voluntário, admin).
// ============================================================

import Airtable from "airtable";
import bcrypt from "bcryptjs"; 

export const config = { runtime: "nodejs" };

// Função auxiliar para retornar erro
const err = (res, code, msg) => res.status(code).json({ sucesso: false, mensagem: msg });

export default async function handler(req, res) {
    // CORS (Cross-Origin Resource Sharing)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).end();

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
        .base(process.env.AIRTABLE_BASE_ID);
    const table = process.env.AIRTABLE_USUARIOS_TABLE || "usuarios";

    try {
        // 🔐 Cadastro (POST)
        if (req.method === "POST") {
            const { 
                nome_usuario, 
                email_usuario, 
                telefone, 
                senha, 
                tipo_usuario, 
                cidade,
                cep,
                endereco,
                numero
            } = req.body || {};
            
            if (!email_usuario || !senha) {
                return err(res, 400, "E-mail e senha são obrigatórios para o cadastro.");
            }

            // 1. Verificação de e-mail duplicado
            const existing = await base(table).select({ 
                filterByFormula: `LOWER({email_usuario}) = '${email_usuario.toLowerCase()}'` 
            }).all();
            
            if (existing.length > 0) {
                return err(res, 409, "Este e-mail já está cadastrado. Tente fazer login.");
            }

            // 2. Hash da senha
            const hash = await bcrypt.hash(senha, 8); // 8 é um bom custo para o bcrypt

            // 3. Criação do registro no Airtable
            const novo = await base(table).create([
                {
                    fields: {
                        nome_usuario,
                        email_usuario,
                        telefone,
                        senha: hash,
                        tipo_usuario: tipo_usuario || "doador", // Padrão: doador
                        cidade,
                        cep,
                        endereco,
                        numero,
                        status: "ativo",
                    },
                },
            ]);

            return res.status(201).json({ 
                sucesso: true, 
                mensagem: "Usuário cadastrado com sucesso.",
                id_usuario: novo[0].id 
            });
        }

        // 🔑 Login (GET)
        if (req.method === "GET") {
            const { email, senha } = req.query;
            if (!email || !senha)
                return err(res, 400, "Email e senha são obrigatórios para o login.");

            const records = await base(table)
                .select({
                    filterByFormula: `AND(LOWER({email_usuario})='${email.toLowerCase()}', {status}='ativo')`,
                })
                .all();

            if (records.length === 0)
                return err(res, 401, "Usuário ou e-mail não encontrado ou inativo.");

            const user = records[0].fields;
            const match = await bcrypt.compare(senha, user.senha || "");

            if (!match)
                return err(res, 401, "Senha incorreta.");
            
            // Retorna dados filtrados do usuário (sem a senha hashada)
            const { senha: _, ...usuarioDados } = user; 

            return res.status(200).json({ sucesso: true, usuario: usuarioDados, id_usuario: records[0].id });
        }

        return err(res, 405, "Método não suportado.");
    } catch (e) {
        console.error("Erro /api/usuarios:", e);
        // Retorna 500 (Internal Server Error)
        return err(res, 500, "Erro interno do servidor ao processar sua solicitação: " + e.message);
    }
}