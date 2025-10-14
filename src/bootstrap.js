// src/bootstrap.js (CÓDIGO FINAL DE LANÇAMENTO)

const db = require('./config/database'); 
const bcrypt = require('bcryptjs'); 

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_PERFIL = 'administrador'; 
const ADMIN_NOME_COMPLETO = 'Administrador do Sistema';

// Função auxiliar para forçar a adição de colunas críticas via SQL cru (bypass do cache Knex)
async function ensureCriticalUserColumnsRaw(knex) {
    try {
        // Tenta um SELECT seguro para verificar se as colunas essenciais existem.
        await knex.raw('SELECT login, senha_hash, perfil, nome_completo, nome, ativo, email FROM usuarios LIMIT 1'); 
        return; // Schema está OK
    } catch (e) {
        if (e.code !== '42703') throw e; // Só trata o erro de coluna inexistente

        console.log('[Bootstrap Fix - RAW SQL] Colunas críticas ausentes. Aplicando ALTER TABLE forçado...');
        
        // A. Adiciona TODAS as colunas em comandos separados
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS login VARCHAR(50);`);
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);`);
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(20);`);
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN;`);
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255);`);
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome VARCHAR(255);`);
        await knex.raw(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255);`); // CRÍTICO: Coluna email
        
        // B. Preenche os dados temporários e define NOT NULL
        await knex.raw(`UPDATE usuarios SET login = 'temp_user_' || id::text WHERE login IS NULL;`);
        await knex.raw(`UPDATE usuarios SET senha_hash = '' WHERE senha_hash IS NULL;`);
        await knex.raw(`UPDATE usuarios SET perfil = 'Usuario' WHERE perfil IS NULL;`);
        await knex.raw(`UPDATE usuarios SET ativo = TRUE WHERE ativo IS NULL;`);
        await knex.raw(`UPDATE usuarios SET nome_completo = 'Nome Incompleto' WHERE nome_completo IS NULL;`);
        await knex.raw(`UPDATE usuarios SET nome = 'Nome Incompleto' WHERE nome IS NULL;`);
        await knex.raw(`UPDATE usuarios SET email = 'temp_email_' || id::text || '@temp.com' WHERE email IS NULL;`); // CRÍTICO: Preenche email
        
        // C. Define as constraints NOT NULL e UNIQUE
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN login SET NOT NULL;`);
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN senha_hash SET NOT NULL;`);
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN perfil SET NOT NULL;`);
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN ativo SET NOT NULL;`);
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN nome_completo SET NOT NULL;`);
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN nome SET NOT NULL;`);
        await knex.raw(`ALTER TABLE usuarios ALTER COLUMN email SET NOT NULL;`); // CRÍTICO: Define NOT NULL para email
        
        await knex.raw(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_login_unique') THEN
                    ALTER TABLE usuarios ADD CONSTRAINT usuarios_login_unique UNIQUE (login);
                END IF;
            END $$;
        `);

        console.log('[Bootstrap Fix] Correção RAW SQL aplicada com sucesso.');
    }
}

async function bootstrapDatabase() {
    console.log('[Bootstrap] Iniciando verificacao e populacao de dados essenciais...');
    
    try {
        await ensureCriticalUserColumnsRaw(db);

        // 1. Verificar se o usuário admin já existe
        const adminUser = await db('usuarios')
            .where({ login: ADMIN_LOGIN })
            .first();

        if (adminUser) {
            console.log('[Bootstrap] O usuario admin ja existe. Pulando criacao.');
            return; 
        }

        console.log('[Bootstrap] Usuario admin nao encontrado. Populando o banco de dados com dados iniciais...');

        const senhaPlana = ADMIN_PASSWORD;
        const senhaHash = await bcrypt.hash(senhaPlana, 10);

        // 2. Criação de dados (INSERINDO TODOS OS VALORES OBRIGATÓRIOS)
        await db('usuarios').insert({
            login: ADMIN_LOGIN,
            senha_hash: senhaHash,
            perfil: ADMIN_PERFIL,
            ativo: true,
            nome_completo: ADMIN_NOME_COMPLETO,
            nome: ADMIN_NOME_COMPLETO,
            email: `${ADMIN_LOGIN}@sisgpo.com`, // CRÍTICO: Valor para a coluna "email"
        });
        console.log('-> Usuario "admin" criado com sucesso.');

        // Resto do seeding (OBMs, Militares, Viaturas)
        const [obm] = await db('obms')
            .insert([{ nome: 'Comando Geral do Corpo de Bombeiros', abreviatura: 'CGCBM', cidade: 'Goiania', telefone: '6232012000' }])
            .returning('id');

        await db('militares').insert([{
            matricula: '000000', nome_completo: ADMIN_NOME_COMPLETO, nome_guerra: 'Admin', posto_graduacao: 'Sistema', ativo: true, obm_nome: 'Comando Geral do Corpo de Bombeiros',
        }]);

        await db('viaturas').insert([{
            prefixo: 'VTR-ADM', ativa: true, cidade: 'Goiania', obm: 'Comando Geral do Corpo de Bombeiros',
        }]);
        
        console.log('OK. [Bootstrap] Banco de dados populado com sucesso!');
        
    } catch (error) {
        console.error(`ERRO [Bootstrap] Erro critico durante o processo de bootstrap: ${error}`);
        throw error;
    }
}

module.exports = bootstrapDatabase;