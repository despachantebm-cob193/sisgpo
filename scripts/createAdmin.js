// scripts/createAdmin.js
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

async function createAdminUser() {
  console.log('Iniciando criacao do usuario admin de desenvolvimento...');

  const login = 'admin';
  const senhaPlana = 'cbmgo@2025';
  const perfil = 'admin';

  try {
    await db('usuarios').where({ login }).del();
    console.log('Usuario "admin" antigo removido (se existia).');

    console.log('Criptografando a nova senha...');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    console.log('Senha criptografada com sucesso!');

    console.log('Inserindo usuario no banco de dados...');
    const [newUser] = await db('usuarios')
      .insert({
        login,
        senha_hash: senhaHash,
        perfil,
        ativo: true,
        nome_completo: 'Administrador do Sistema',
        nome: 'Admin',
        email: 'admin@cbm.df.gov.br',
      })
      .returning('*');

    console.log('OK Usuario Admin de desenvolvimento criado/atualizado com sucesso!');
    console.log({
      id: newUser.id,
      login: newUser.login,
      perfil: newUser.perfil,
      ativo: newUser.ativo,
    });
  } catch (error) {
    console.error('ERRO ao criar o usuario admin:', error);
  } finally {
    await db.destroy();
    console.log('Conexao com o banco de dados encerrada.');
  }
}

createAdminUser();
