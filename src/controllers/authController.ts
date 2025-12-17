import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import db from '../config/database';
import AppError from '../utils/AppError';

const DEFAULT_GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'postmessage';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  DEFAULT_GOOGLE_REDIRECT_URI
);

const isConnectionLimitError = (error: any) => {
  const msg = error?.message ? error.message.toLowerCase() : '';
  return (
    msg.includes('max clients in sessionmode') ||
    msg.includes('too many clients') ||
    msg.includes('remaining connection slots are reserved') ||
    msg.includes('connection pool') ||
    msg.includes('pool_size')
  );
};

type UserDbRecord = {
  id: number;
  login: string;
  email?: string;
  senha_hash?: string;
  perfil?: string;
  ativo?: boolean;
  status?: string;
  nome?: string;
  perfil_desejado?: string;
};

const authController = {
  login: async (req: Request, res: Response) => {
    const { login, senha } = req.body as { login?: string; senha?: string };
    const rawLogin = typeof login === 'string' ? login.trim() : '';

    if (!rawLogin || !senha) {
      throw new AppError('Login e senha sao obrigatorios.', 400);
    }

    console.log(`[AuthController] Tentativa de login para o usuario: ${rawLogin}`);

    const normalizedLogin = rawLogin.toLowerCase();

    let user: UserDbRecord | undefined;
    try {
      user = await db<UserDbRecord>('usuarios')
        .select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome', 'perfil_desejado')
        .whereRaw('LOWER(login) = ?', [normalizedLogin])
        .orWhereRaw('LOWER(email) = ?', [normalizedLogin])
        .first();
    } catch (err) {
      if (isConnectionLimitError(err)) {
        throw new AppError('Banco indisponivel no momento (limite de conexoes). Tente novamente em instantes.', 503);
      }
      throw err;
    }

    if (!user) {
      console.log(`[AuthController] Usuario '${rawLogin}' nao encontrado.`);
    } else if (!user.ativo) {
      console.log(`[AuthController] Conta desativada para o usuario '${rawLogin}'.`);
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    if (user && user.status === 'pending' && user.perfil && !user.perfil_desejado) {
      try {
        await db('usuarios').where({ id: user.id }).update({ status: 'approved', updated_at: db.fn.now() });
        user.status = 'approved';
      } catch (err) {
        if (isConnectionLimitError(err)) {
          throw new AppError('Banco indisponivel no momento (limite de conexoes). Tente novamente em instantes.', 503);
        }
        throw err;
      }
    }

    if (user?.status === 'pending') {
      throw new AppError('Sua conta esta pendente de aprovacao.', 401);
    }

    if (user?.status === 'rejected') {
      throw new AppError('Sua conta foi rejeitada.', 401);
    }

    let isPasswordValid = false;

    if (user) {
      const storedHash = user.senha_hash || '';
      const isBcryptHash = typeof storedHash === 'string' && /^\$2[aby]\$/.test(storedHash);

      if (isBcryptHash) {
        isPasswordValid = await bcrypt.compare(senha, storedHash);
      } else if (senha === storedHash) {
        isPasswordValid = true;
        try {
          const newHash = await bcrypt.hash(senha, 10);
          await db('usuarios').where({ id: user.id }).update({ senha_hash: newHash });
          user.senha_hash = newHash;
          console.log(`[AuthController] Senha de '${rawLogin}' migrada automaticamente para hash bcrypt.`);
        } catch (rehashError) {
          console.warn(`[AuthController] Falha ao migrar a senha do usuario '${rawLogin}' para bcrypt:`, rehashError);
        }
      }
    }

    if (!user || !isPasswordValid) {
      if (user && !isPasswordValid) {
        console.log(`[AuthController] Senha invalida para o usuario '${rawLogin}'.`);
      }
      throw new AppError('Credenciais invalidas.', 401);
    }

    console.log(`[AuthController] Login bem-sucedido para '${rawLogin}'.`);

    const perfil = (user.perfil || '').toLowerCase();

    const token = jwt.sign({ id: user.id, login: user.login, perfil }, process.env.JWT_SECRET as string, {
      expiresIn: '8h',
    });

    delete (user as any).senha_hash;
    user.perfil = perfil;
    user.ativo = Boolean(user.ativo);

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user,
    });
  },

  googleLogin: async (req: Request, res: Response) => {
    const { code, codeVerifier, redirectUri, redirect_uri: redirectUriSnake } = req.body as any;

    if (!code) {
      throw new AppError('Codigo de autorizacao do Google nao fornecido.', 400);
    }

    const requestedRedirectUri =
      (typeof redirectUri === 'string' && redirectUri) || (typeof redirectUriSnake === 'string' && redirectUriSnake);

    const oauthToken = await client.getToken({
      code,
      codeVerifier,
      redirect_uri: requestedRedirectUri || DEFAULT_GOOGLE_REDIRECT_URI,
    });

    const idToken = oauthToken.tokens.id_token;
    if (!idToken) {
      throw new AppError('Token de ID nao retornado pelo Google.', 400);
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError('Nao foi possivel validar o token do Google.', 400);
    }

    const email = (payload.email || '').toLowerCase();

    const user = await db<UserDbRecord>('usuarios')
      .select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome')
      .whereRaw('LOWER(email) = ?', [email])
      .first();

    if (!user) {
      throw new AppError('Usuario nao cadastrado. Solicite acesso ao administrador.', 403);
    }

    if (!user.ativo) {
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    if (user.status === 'pending') {
      throw new AppError('Sua conta esta pendente de aprovacao.', 401);
    }

    if (user.status === 'rejected') {
      throw new AppError('Sua conta foi rejeitada.', 401);
    }

    console.log(`[AuthController] Login com Google bem-sucedido para '${user.email}'.`);

    const perfil = (user.perfil || '').toLowerCase();
    const token = jwt.sign({ id: user.id, login: user.login, perfil }, process.env.JWT_SECRET as string, {
      expiresIn: '8h',
    });

    delete (user as any).senha_hash;
    user.perfil = perfil;
    user.ativo = Boolean(user.ativo);

    return res.status(200).json({
      message: 'Login com Google bem-sucedido!',
      token,
      user,
    });
  },

  ssoLogin: async (req: Request, res: Response) => {
    const payload = (req as any).ssoPayload as any;

    if (!payload || typeof payload !== 'object') {
      throw new AppError('Payload SSO ausente ou invalido.', 400);
    }

    const emailClaim = (payload.email || payload.user_email || '').toString().toLowerCase();

    if (!emailClaim) {
      throw new AppError('Token SSO nao contem e-mail do usuario.', 400);
    }

    const user = await db<UserDbRecord>('usuarios')
      .select('id', 'login', 'email', 'senha_hash', 'perfil', 'ativo', 'status', 'nome')
      .whereRaw('LOWER(email) = ?', [emailClaim])
      .first();

    if (!user) {
      throw new AppError('Usuario nao cadastrado no SISGPO. Solicite acesso ao administrador.', 403);
    }

    if (!user.ativo) {
      throw new AppError('Conta desativada. Procure um administrador.', 403);
    }

    if (user.status === 'pending') {
      throw new AppError('Sua conta esta pendente de aprovacao.', 401);
    }

    if (user.status === 'rejected') {
      throw new AppError('Sua conta foi rejeitada.', 401);
    }

    const perfil = (user.perfil || '').toLowerCase();
    const token = jwt.sign({ id: user.id, login: user.login, perfil }, process.env.JWT_SECRET as string, {
      expiresIn: '8h',
    });

    delete (user as any).senha_hash;
    user.perfil = perfil;
    user.ativo = Boolean(user.ativo);

    return res.status(200).json({
      message: 'Login SSO bem-sucedido!',
      token,
      user,
    });
  },
};

export = authController;
