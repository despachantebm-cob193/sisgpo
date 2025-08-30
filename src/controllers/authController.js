// src/controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authController = {
  login: async (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
      throw new AppError('Login e senha são obrigatórios.', 400);
    }

    console.log(`[AuthController] Buscando usuário com login: ${login}`);
    
    // 2. MUDANÇA: Usar a sintaxe do Knex para a consulta
    const user = await db('usuarios').where({ login }).first();

    console.log(`[AuthController] Usuário encontrado:`, user ? user.login : 'Nenhum');

    if (!user) {
      // Mensagem genérica para não informar se o usuário existe ou não (segurança)
      throw new AppError('Credenciais inválidas.', 401);
    }

    // A comparação do bcrypt deve funcionar corretamente agora
    const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

    console.log(`[AuthController] A senha fornecida é válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = jwt.sign(
      { id: user.id, login: user.login, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Remove o hash da senha do objeto retornado para o cliente
    delete user.senha_hash;

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user,
    });
  },
};

module.exports = authController;
