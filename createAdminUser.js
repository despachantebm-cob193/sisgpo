// createAdminUser.js
//
// Utilidade de linha de comando para garantir a existencia de um usuario administrador.
// Uso:
//   node createAdminUser.js
//
// E possivel personalizar os dados via variaveis de ambiente:
//   ADMIN_LOGIN, ADMIN_PASSWORD, ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_NOME, ADMIN_PERFIL

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

const login = (process.env.ADMIN_LOGIN || 'admin').trim();
const senhaPlana = process.env.ADMIN_PASSWORD || 'cbmgo@2025';
const nomeCompletoConfig = process.env.ADMIN_FULL_NAME || 'Administrador do Sistema';
const nomeCurtoEnv = process.env.ADMIN_NOME;
const emailConfig = process.env.ADMIN_EMAIL || `${login}@sisgpo.com`;
const perfilConfig = (process.env.ADMIN_PERFIL || 'admin').toLowerCase();

const nomeCompleto = nomeCompletoConfig.trim();
const nomeCurto = nomeCurtoEnv ? nomeCurtoEnv.trim() : (nomeCompleto.split(/\s+/)[0] || nomeCompleto);
const email = emailConfig.trim().toLowerCase();

async function ensureAdminUser() {
  console.log('--- Iniciando criacao de usuario admin ---');
  console.log(`Login alvo: ${login}`);

  if (!login) {
    throw new Error('ADMIN_LOGIN invalido. Defina uma credencial valida antes de prosseguir.');
  }

  if (!senhaPlana) {
    throw new Error('ADMIN_PASSWORD vazio. Defina uma senha para o administrador.');
  }

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
    console.log(`Credenciais:\n  - login: ${login}\n  - senha: ${senhaPlana}`);
  } catch (error) {
    console.error('Falha ao criar o usuario admin:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
    console.log('Conexao com o banco encerrada.');
  }
}

ensureAdminUser();
