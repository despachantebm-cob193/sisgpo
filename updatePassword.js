// updatePassword.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function setupAdminUser() {
  const login = 'admin';
  const senhaPlana = 'cbmgo@2025'; // A senha que usaremos
  const perfil = 'admin';

  const client = await pool.connect();
  console.log('Conectado ao banco de dados de produção...');

  try {
    // 1. Verificar se o usuário 'admin' já existe
    const userExists = await client.query('SELECT * FROM usuarios WHERE login = $1', [login]);

    // Criptografa a nova senha
    console.log('Criptografando a senha...');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    console.log('Senha criptografada com sucesso!');

    if (userExists.rows.length > 0) {
      // 2a. Se existe, ATUALIZA a senha
      console.log('Usuário "admin" encontrado. Atualizando a senha...');
      await client.query(
        'UPDATE usuarios SET senha_hash = $1, perfil = $2 WHERE login = $3',
        [senhaHash, perfil, login]
      );
      console.log('✅ Senha do usuário "admin" atualizada com sucesso em produção!');
    } else {
      // 2b. Se não existe, CRIA o usuário
      console.log('Usuário "admin" não encontrado. Criando novo usuário...');
      await client.query(
        'INSERT INTO usuarios (login, senha_hash, perfil) VALUES ($1, $2, $3)',
        [login, senhaHash, perfil]
      );
      console.log('🎉 Usuário "admin" criado com sucesso em produção!');
    }

  } catch (error) {
    console.error('❌ Erro ao configurar o usuário admin:', error);
  } finally {
    // 3. Fecha a conexão
    await client.release();
    await pool.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
}

setupAdminUser();
