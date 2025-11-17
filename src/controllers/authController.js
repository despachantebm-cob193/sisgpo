// Arquivo: src/controllers/authController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const DEFAULT_GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'postmessage';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  DEFAULT_GOOGLE_REDIRECT_URI,
);

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
      .select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome')
      .whereRaw('LOWER(login) = ?', [normalizedLogin])
      .orWhereRaw('LOWER(email) = ?', [normalizedLogin])
      .first();

    if (!user) {
      console.log(`[AuthController] Usuário '${rawLogin}' não encontrado.`);
    } else if (!user.ativo) {
      console.log(`[AuthController] Conta desativada para o usuário '${rawLogin}'.`);
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    if (
      user &&
      user.status === 'pending' &&
      user.perfil &&
      !user.perfil_desejado
    ) {
      await db('usuarios')
        .where({ id: user.id })
        .update({ status: 'approved', updated_at: db.fn.now() });
      user.status = 'approved';
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
    const {
      code,
      codeVerifier,
      redirectUri,
      redirect_uri: redirectUriSnake,
    } = req.body;

    if (!code) {
      throw new AppError('Código de autorização do Google não fornecido.', 400);
    }

    const requestedRedirectUri =
      (typeof redirectUri === 'string' && redirectUri) ||
      (typeof redirectUriSnake === 'string' && redirectUriSnake) ||
      DEFAULT_GOOGLE_REDIRECT_URI;
    const resolvedRedirectUri = requestedRedirectUri.trim() || DEFAULT_GOOGLE_REDIRECT_URI;

    let idToken;
    try {
      const tokenRequest = {
        code,
        redirect_uri: resolvedRedirectUri,
      };
      if (codeVerifier) {
        tokenRequest.codeVerifier = codeVerifier;
      }
      const { tokens } = await client.getToken(tokenRequest);
      idToken = tokens.id_token;
    } catch (error) {
      console.error('Erro ao trocar código por tokens do Google:', error.message);
      throw new AppError('Falha na autenticação com Google. Código inválido ou expirado.', 401);
    }

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: google_id } = payload;

    if (!email) {
      throw new AppError('Não foi possível obter o e-mail da conta Google.', 400);
    }

    let user = await db('usuarios').select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome').where({ google_id }).first();

    if (!user) {
      user = await db('usuarios').select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome').where({ email }).first();
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

  ssoLogin: async (req, res) => {
    const payload = req.ssoPayload;

    if (!payload || typeof payload !== 'object') {
      throw new AppError('Payload SSO ausente ou inválido.', 400);
    }

    const emailClaim = (payload.email || payload.user_email || '').toString().toLowerCase();

    if (!emailClaim) {
      throw new AppError('Token SSO não contém e-mail do usuário.', 400);
    }

    const user = await db('usuarios')
      .select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome')
      .whereRaw('LOWER(email) = ?', [emailClaim])
      .first();

    if (!user) {
      throw new AppError('Usuário não cadastrado no SISGPO. Solicite acesso ao administrador.', 403);
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
      message: 'Login SSO bem-sucedido!',
      token,
      user,
    });
  },
};

module.exports = authController;
