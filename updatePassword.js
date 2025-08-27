// updatePassword.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function atualizarSenha() {
  const loginParaAtualizar = 'admin';
  const novaSenha = 'cbmgo@2025'; // <<< Use esta senha. É segura e fácil de lembrar para o teste.

  try {
    // Criptografa a nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza a senha no banco de dados para o usuário 'admin'
    const result = await pool.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE login = $2 RETURNING id, login, perfil;',
      [senhaHash, loginParaAtualizar]
    );

    if (result.rowCount > 0) {
      console.log('Senha do usuário "admin" atualizada com sucesso!');
      console.log('Use as seguintes credenciais nos seus testes:');
      console.log(`Login: ${loginParaAtualizar}`);
      console.log(`Senha: ${novaSenha}`);
    } else {
      console.log('Usuário "admin" não encontrado.');
    }

  } catch (error) {
    console.error('Erro ao atualizar a senha:', error.message);
  } finally {
    await pool.end();
  }
}

atualizarSenha();
