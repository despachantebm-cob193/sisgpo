const db = require('../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

const userController = {
  /**
   * Altera a senha do usuário logado.
   */
  changePassword: async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.userId; // ID do usuário vem do middleware de autenticação

    // 1. Buscar o usuário no banco
    const user = await db('usuarios').where({ id: userId }).first();
    if (!user) {
      // Este caso é raro, pois o usuário deve estar logado para chegar aqui
      throw new AppError('Usuário não encontrado.', 404);
    }

    // 2. Verificar se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!isPasswordValid) {
      throw new AppError('A senha atual está incorreta.', 400);
    }

    // 3. Gerar o hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    // 4. Atualizar a senha no banco de dados
    await db('usuarios')
      .where({ id: userId })
      .update({
        senha_hash: novaSenhaHash,
        updated_at: db.fn.now(),
      });

    res.status(200).json({ message: 'Senha alterada com sucesso!' });
  },
};

module.exports = userController;
