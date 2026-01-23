import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '../config/knex';

const login = (process.env.ADMIN_LOGIN || '').trim();
const senhaPlana = process.env.ADMIN_PASSWORD || '';
const nomeCompletoConfig = process.env.ADMIN_FULL_NAME || 'Administrador do Sistema';
const nomeCurtoEnv = process.env.ADMIN_NOME;
const emailConfig = process.env.ADMIN_EMAIL || `${login}@sisgpo.com`;
const perfilConfig = (process.env.ADMIN_PERFIL || 'admin').toLowerCase();

const nomeCompleto = nomeCompletoConfig.trim();
const nomeCurto = nomeCurtoEnv ? nomeCurtoEnv.trim() : nomeCompleto.split(/\s+/)[0] || nomeCompleto;
const email = emailConfig.trim().toLowerCase();

async function ensureAdminUser() {
  console.log('--- Iniciando criacao de usuario admin ---');

  if (!login) {
    throw new Error('CONFIG ERROR: ADMIN_LOGIN nao definido no .env. O script foi abortado por seguranca.');
  }

  if (!senhaPlana) {
    throw new Error('CONFIG ERROR: ADMIN_PASSWORD nao definido no .env. O script foi abortado por seguranca.');
  }

  console.log(`Login alvo: ${login}`);

  try {
    const existingUser = await db('usuarios').where({ login }).first();

    if (existingUser) {
      console.log(`Usuario "${login}" ja existe (id=${existingUser.id}). Nenhuma alteracao necessaria.`);
      return;
    }

    console.log('Usuario nao encontrado. Gerando hash da senha e inserindo registro...');
    const senhaHash = await bcrypt.hash(senhaPlana, 10);

    await db('usuarios').insert({
      login,
      senha_hash: senhaHash,
      perfil: perfilConfig,
      ativo: true,
      nome_completo: nomeCompleto,
      nome: nomeCurto,
      email,
    });

    console.log('Usuario administrador criado com sucesso!');
    console.log(`Credenciais:\n  - login: ${login}\n  - senha: [PROTEGUIDA]`);
  } catch (error) {
    console.error('Falha ao criar o usuario admin:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
    console.log('Conexao com o banco encerrada.');
  }
}

ensureAdminUser();
