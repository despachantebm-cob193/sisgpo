// scripts/createAdmin.js
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

async function createAdminUser() {
  console.log('Iniciando criação do usuário admin de desenvolvimento...');

  const login = 'admin';
  // ALTERE A SENHA AQUI para corresponder ao ambiente de teste/produção
  const senhaPlana = 'cbmgo@2025'; 
  const perfil = 'Admin';

  try {
    // Primeiro, vamos remover o usuário admin antigo para garantir a atualização
    await pool.query('DELETE FROM usuarios WHERE login = $1', [login]);
    console.log('Usuário "admin" antigo removido (se existia).');

    // Criptografar a nova senha
    console.log('Criptografando a nova senha...');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    console.log('Senha criptografada com sucesso!');

    // Inserir o novo usuário no banco de dados
    console.log('Inserindo usuário no banco de dados...');
    const result = await pool.query(
      'INSERT INTO usuarios (login, senha_hash, perfil) VALUES ($1, $2, $3) RETURNING *',
      [login, senhaHash, perfil]
    );

    const newUser = result.rows[0];
    console.log('🎉 Usuário Admin de desenvolvimento criado/atualizado com sucesso! 🎉');
    console.log({
      id: newUser.id,
      login: newUser.login,
      perfil: newUser.perfil,
    });

  } catch (error) {
    console.error('❌ Erro ao criar o usuário admin:', error);
  } finally {
    await pool.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
}

createAdminUser();
