// updatePassword.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function setupAdminUser() {
  const login = 'admin';
  const senhaPlana = 'cbmgo@2025';
  const perfil = 'admin';

  const client = await pool.connect();
  console.log('Conectado ao banco de dados...');

  try {
    const userExists = await client.query('SELECT * FROM usuarios WHERE login = $1', [login]);

    console.log('Criptografando a senha...');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    console.log('Senha criptografada com sucesso!');

    if (userExists.rows.length > 0) {
      console.log('Usuario "admin" encontrado. Atualizando credenciais...');
      await client.query(
        'UPDATE usuarios SET senha_hash = $1, perfil = $2, ativo = $3 WHERE login = $4',
        [senhaHash, perfil, true, login]
      );
      console.log('OK. Senha do usuario "admin" atualizada com sucesso.');
    } else {
      console.log('Usuario "admin" nao encontrado. Criando novo usuario...');
      await client.query(
        'INSERT INTO usuarios (login, senha_hash, perfil, ativo) VALUES ($1, $2, $3, $4)',
        [login, senhaHash, perfil, true]
      );
      console.log('Usuario "admin" criado com sucesso!');
    }
  } catch (error) {
    console.error('ERRO ao configurar o usuario admin:', error);
  } finally {
    await client.release();
    await pool.end();
    console.log('Conexao com o banco de dados encerrada.');
  }
}

setupAdminUser();
