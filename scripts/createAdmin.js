// Este script é para ser executado manualmente para criar o primeiro usuário.

require('dotenv').config({ path: '../.env' }); // Aponta para o .env na pasta raiz
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database'); // Puxa nossa configuração de DB

async function createAdminUser() {
  console.log('Iniciando criação do usuário admin...');

  const login = 'admin';
  const senhaPlana = 'admin123'; // Defina uma senha inicial segura
  const perfil = 'Admin';

  try {
    // 1. Verificar se o usuário 'admin' já existe
    const userExists = await pool.query('SELECT * FROM usuarios WHERE login = $1', [login]);
    if (userExists.rows.length > 0) {
      console.log('Usuário "admin" já existe. Nenhuma ação necessária.');
      return; // Encerra o script se o usuário já existir
    }

    // 2. Criptografar a senha
    console.log('Criptografando a senha...');
    const salt = await bcrypt.genSalt(10); // Gera o "sal" para o hash
    const senhaHash = await bcrypt.hash(senhaPlana, salt); // Cria o hash da senha
    console.log('Senha criptografada com sucesso!');

    // 3. Inserir o novo usuário no banco de dados
    console.log('Inserindo usuário no banco de dados...');
    const result = await pool.query(
      'INSERT INTO usuarios (login, senha_hash, perfil) VALUES ($1, $2, $3) RETURNING *',
      [login, senhaHash, perfil]
    );

    const newUser = result.rows[0];
    console.log('🎉 Usuário Admin criado com sucesso! 🎉');
    console.log({
      id: newUser.id,
      login: newUser.login,
      perfil: newUser.perfil,
    });

  } catch (error) {
    console.error('❌ Erro ao criar o usuário admin:', error);
  } finally {
    // 4. Fechar a conexão com o banco
    await pool.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
}

// Executa a função
createAdminUser();
