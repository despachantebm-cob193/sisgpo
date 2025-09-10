// Arquivo: src/controllers/authController.js

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

    console.log(`[AuthController] Tentativa de login para o utilizador: ${login}`);
    
    const user = await db('usuarios').where({ login }).first();

    if (!user) {
      console.log(`[AuthController] Utilizador '${login}' não encontrado.`);
      // Usa um erro 401 (Não Autorizado) para credenciais inválidas
      throw new AppError('Credenciais inválidas.', 401);
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

    if (!isPasswordValid) {
      console.log(`[AuthController] Senha inválida para o utilizador '${login}'.`);
      throw new AppError('Credenciais inválidas.', 401);
    }
    
    console.log(`[AuthController] Login bem-sucedido para '${login}'.`);

    const token = jwt.sign(
      { id: user.id, login: user.login, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expira em 8 horas
    );

    // Nunca retorne o hash da senha para o cliente
    delete user.senha_hash;

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user,
    });
  },
};

module.exports = authController;
