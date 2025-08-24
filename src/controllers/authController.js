const pool = require('../config/database'); // Nosso pool de conexões
const bcrypt = require('bcryptjs'); // Para comparar senhas
const jwt = require('jsonwebtoken'); // Para gerar o token

const authController = {
  // Método para lidar com o login
  login: async (req, res) => {
    try {
      const { login, senha } = req.body;

      // 1. Validação básica de entrada
      if (!login || !senha) {
        return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
      }

      // 2. Buscar o usuário no banco de dados
      const result = await pool.query('SELECT * FROM usuarios WHERE login = $1', [login]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas.' }); // Não especificar se foi usuário ou senha
      }

      // 3. Comparar a senha enviada com a senha hasheada do banco
      const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      // 4. Gerar o token JWT
      const token = jwt.sign(
        {
          id: user.id,
          login: user.login,
          perfil: user.perfil,
        },
        process.env.JWT_SECRET, // Nosso segredo do .env
        {
          expiresIn: '8h', // O token expira em 8 horas
        }
      );

      // 5. Enviar a resposta com o token
      res.status(200).json({
        message: 'Login bem-sucedido!',
        token,
        user: {
          id: user.id,
          login: user.login,
          perfil: user.perfil,
        },
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },
};

module.exports = authController;
