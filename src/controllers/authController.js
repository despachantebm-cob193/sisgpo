const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authController = {
  login: async (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
      throw new AppError('Login e senha são obrigatórios.', 400);
    }

    // DEBUG: Log para ver o que está sendo buscado
    console.log(`[AuthController] Buscando usuário com login: ${login}`);
    
    const result = await pool.query('SELECT * FROM usuarios WHERE login = $1', [login]);
    const user = result.rows[0];

    // DEBUG: Log para ver se o usuário foi encontrado
    console.log(`[AuthController] Usuário encontrado:`, user ? user.login : 'Nenhum');

    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

    // DEBUG: Log para ver se a senha é válida
    console.log(`[AuthController] A senha fornecida é válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = jwt.sign(
      { id: user.id, login: user.login, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user: { id: user.id, login: user.login, perfil: user.perfil },
    });
  },
};

module.exports = authController;
