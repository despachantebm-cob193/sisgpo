// scripts/createAdmin.js
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

async function createAdminUser() {
  console.log('Iniciando criacao do usuario admin de desenvolvimento...');

  const login = 'admin';
  const senhaPlana = 'cbmgo@2025';
  const perfil = 'admin';

  try {
    await pool.query('DELETE FROM usuarios WHERE login = $1', [login]);
    console.log('Usuario "admin" antigo removido (se existia).');

    console.log('Criptografando a nova senha...');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    console.log('Senha criptografada com sucesso!');

    console.log('Inserindo usuario no banco de dados...');
    const result = await pool.query(
      'INSERT INTO usuarios (login, senha_hash, perfil, ativo) VALUES ($1, $2, $3, $4) RETURNING *',
      [login, senhaHash, perfil, true]
    );

    const newUser = result.rows[0];
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
    await pool.end();
    console.log('Conexao com o banco de dados encerrada.');
  }
}

createAdminUser();
