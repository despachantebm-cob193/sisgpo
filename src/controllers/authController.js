// Arquivo: src/controllers/authController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
  login: async (req, res) => {
    const { login, senha } = req.body;
    const rawLogin = typeof login === 'string' ? login.trim() : '';

    if (!rawLogin || !senha) {
      throw new AppError('Login e senha são obrigatórios.', 400);
    }

    console.log(`[AuthController] Tentativa de login para o usuário: ${rawLogin}`);

    const normalizedLogin = rawLogin.toLowerCase();

    const user = await db('usuarios')
      .whereRaw('LOWER(login) = ?', [normalizedLogin])
      .orWhereRaw('LOWER(email) = ?', [normalizedLogin])
      .first();

    if (!user) {
      console.log(`[AuthController] Usuário '${rawLogin}' não encontrado.`);
    } else if (!user.ativo) {
      console.log(`[AuthController] Conta desativada para o usuário '${rawLogin}'.`);
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    if (user.status === 'pending') {
      throw new AppError('Sua conta está pendente de aprovação.', 401);
    }

    if (user.status === 'rejected') {
      throw new AppError('Sua conta foi rejeitada.', 401);
    }

    let isPasswordValid = false;

    if (user) {
      const storedHash = user.senha_hash || '';
      const isBcryptHash =
        typeof storedHash === 'string' && /^\$2[aby]\$/.test(storedHash);

      if (isBcryptHash) {
        isPasswordValid = await bcrypt.compare(senha, storedHash);
      } else {
        if (senha === storedHash) {
          isPasswordValid = true;
          try {
            const newHash = await bcrypt.hash(senha, 10);
            await db('usuarios').where({ id: user.id }).update({ senha_hash: newHash });
            user.senha_hash = newHash;
            console.log(
              `[AuthController] Senha de '${rawLogin}' migrada automaticamente para hash bcrypt.`
            );
          } catch (rehashError) {
            console.warn(
              `[AuthController] Falha ao migrar a senha do usuário '${rawLogin}' para bcrypt:`,
              rehashError
            );
          }
        }
      }
    }

    if (!user || !isPasswordValid) {
      if (user && !isPasswordValid) {
        console.log(`[AuthController] Senha inválida para o usuário '${rawLogin}'.`);
      }
      throw new AppError('Credenciais inválidas.', 401);
    }

    console.log(`[AuthController] Login bem-sucedido para '${rawLogin}'.`);

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

  googleLogin: async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      throw new AppError('Token do Google não fornecido.', 400);
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: google_id } = payload;

    if (!email) {
      throw new AppError('Não foi possível obter o e-mail da conta Google.', 400);
    }

    let user = await db('usuarios').where({ google_id }).first();

    if (!user) {
      user = await db('usuarios').where({ email }).first();
      if (user) {
        await db('usuarios').where({ id: user.id }).update({ google_id });
      }
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const senha_hash = await bcrypt.hash(randomPassword, 10);

      const newUser = {
        nome: name,
        nome_completo: name,
        login: email.split('@')[0],
        email,
        senha_hash,
        google_id,
        perfil: 'user',
        ativo: true,
        status: 'pending',
        perfil_desejado: 'user',
      };

      const [insertedUser] = await db('usuarios').insert(newUser).returning('*');
      user = insertedUser;

      await db('notificacoes').insert({
        mensagem: `Novo usuário cadastrado: ${user.nome_completo} (${user.email})`,
      });
    }

    if (!user.ativo) {
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    if (user.status === 'pending') {
      throw new AppError('Sua conta está pendente de aprovação.', 401);
    }

    if (user.status === 'rejected') {
      throw new AppError('Sua conta foi rejeitada.', 401);
    }

    console.log(`[AuthController] Login com Google bem-sucedido para '${user.email}'.`);

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
      message: 'Login com Google bem-sucedido!',
      token,
      user,
    });
  },
};

module.exports = authController;
