// Arquivo: src/controllers/authController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authController = {
  login: async (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
      throw new AppError('Login e senha sao obrigatorios.', 400);
    }

    console.log(`[AuthController] Tentativa de login para o utilizador: ${login}`);

    const user = await db('usuarios').where({ login }).first();

    if (!user) {
      console.log(`[AuthController] Utilizador '${login}' nao encontrado.`);
      throw new AppError('Credenciais invalidas.', 401);
    }

    if (!user.ativo) {
      console.log(`[AuthController] Conta desativada para o utilizador '${login}'.`);
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

    if (!isPasswordValid) {
      console.log(`[AuthController] Senha invalida para o utilizador '${login}'.`);
      throw new AppError('Credenciais invalidas.', 401);
    }

    console.log(`[AuthController] Login bem-sucedido para '${login}'.`);

    const perfil = (user.perfil || '').toLowerCase();

    const token = jwt.sign(
      { id: user.id, login: user.login, perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    delete user.senha_hash;
    user.perfil = perfil;
    user.ativo = Boolean(user.ativo);

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user,
    });
  },
};

module.exports = authController;
