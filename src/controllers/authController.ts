import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';

import AppError from '../utils/AppError';
import UserRepository from '../repositories/UserRepository';
import { supabaseAdmin } from '../config/supabase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env';
import { registerSession } from '../middlewares/authMiddleware';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const normalizeStatus = (status?: string | null) => (status || '').trim().toLowerCase();

const isPendingStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === 'pending' || normalized === 'pendente';
};

const buildUniqueLogin = async (email: string) => {
  const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9._-]/g, '');
  let candidate = base.slice(0, 50) || 'user';
  let suffix = 0;

  while (await UserRepository.exists('login', candidate)) {
    suffix += 1;
    const suffixToken = `_${suffix}`;
    candidate = `${base.slice(0, 50 - suffixToken.length)}${suffixToken}` || `user${suffixToken}`;
  }

  return candidate;
};

const authController = {
  login: async (req: Request, res: Response) => {
    const { login, senha } = req.body as { login?: string; senha?: string };
    const rawLogin = typeof login === 'string' ? login.trim() : '';

    if (!rawLogin || !senha) {
      throw new AppError('Login e senha são obrigatórios.', 400);
    }

    const userByEmail = await UserRepository.findByEmail(rawLogin);
    const userByLogin = userByEmail ? null : await UserRepository.findByLogin(rawLogin);
    const candidateUser = userByEmail || userByLogin;
    const candidateEmail = userByEmail?.email || userByLogin?.email || rawLogin;

    if (candidateUser) {
      if (isPendingStatus(candidateUser.status)) {
        throw new AppError('Sua conta está pendente de aprovação.', 401);
      }
      if (normalizeStatus(candidateUser.status) === 'rejected') {
        throw new AppError('Sua conta foi rejeitada.', 401);
      }
      if (candidateUser.ativo === false) {
        throw new AppError('Conta desativada.', 403);
      }
    }

    const loginCandidates = Array.from(new Set([candidateEmail, rawLogin].filter(Boolean)));
    let authData: any = null;
    let lastError: any = null;

    const trySupabaseSignIn = async () => {
      for (const email of loginCandidates) {
        const attempt = await supabasePublic.auth.signInWithPassword({
          email,
          password: senha
        });
        if (!attempt.error) {
          authData = attempt.data;
          return;
        }
        lastError = attempt.error;
      }
    };

    await trySupabaseSignIn();

    // Fallback de migração: sincroniza senha com Supabase Auth se necessário
    if (!authData && candidateUser?.senha_hash && candidateUser?.email) {
      console.log(`[Auth] Iniciando fallback de migração para: ${candidateUser.email}`);
      const senhaConfere = await bcrypt.compare(senha, candidateUser.senha_hash);

      if (senhaConfere) {
        console.log('[Auth] Senha local bate. Sincronizando com Supabase Auth...');
        if (candidateUser.supabase_id) {
          console.log(`[Auth] Atualizando senha do usuário existente: ${candidateUser.supabase_id}`);
          await supabaseAdmin.auth.admin.updateUserById(candidateUser.supabase_id, {
            password: senha,
            email_confirm: true,
          });
        } else {
          console.log('[Auth] Criando novo usuário no Supabase Auth...');
          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: candidateUser.email,
            password: senha,
            email_confirm: true,
            user_metadata: { login: candidateUser.login }
          });

          if (createError) {
            console.error('[Auth] Erro ao criar usuário no fallback:', createError.message);
          } else if (created?.user?.id && candidateUser.id) {
            console.log(`[Auth] Novo usuário criado: ${created.user.id}. Vinculando...`);
            await UserRepository.update(candidateUser.id, { supabase_id: created.user.id });
          }
        }
        console.log('[Auth] Tentando login novamente após sincronização...');
        await trySupabaseSignIn();
      } else {
        console.warn('[Auth] Senha local NÃO confere.');
      }
    }

    if (!authData) {
      console.warn(`[Auth] Falha login Supabase para ${rawLogin}: ${lastError?.message || 'unknown'}`);
      throw new AppError('Credenciais inválidas.', 401);
    }

    const session = authData.session;
    const userAuth = authData.user;

    if (!userAuth) {
      throw new AppError('Erro na autenticação.', 401);
    }

    let user = await UserRepository.findByEmail(userAuth.email || '');
    if (!user && candidateUser) {
      user = candidateUser;
    }
    if (!user) {
      user = await UserRepository.findByLogin(rawLogin);
    }

    if (!user) {
      throw new AppError('Usuário autenticado mas não encontrado no sistema local.', 401);
    }

    if (isPendingStatus(user.status)) {
      throw new AppError('Sua conta está pendente de aprovação.', 401);
    }
    if (normalizeStatus(user.status) === 'rejected') {
      throw new AppError('Sua conta foi rejeitada.', 401);
    }
    if (!user.ativo) {
      throw new AppError('Conta desativada.', 403);
    }

    if (user.id && !user.supabase_id) {
      await UserRepository.update(user.id, { supabase_id: userAuth.id });
    }

    const userResponse = { ...user };
    // @ts-ignore
    delete userResponse.senha_hash;

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token: session?.access_token,
      refreshToken: session?.refresh_token,
      user: {
        ...userResponse,
        supabase_id: userAuth?.id
      },
    });
  },

  googleLogin: async (req: Request, res: Response) => {
    const { credential } = req.body as { credential?: string };

    if (!credential) {
      throw new AppError('Token Google não fornecido.', 400);
    }

    let payload: any | undefined;
    const isTestCredential = env.NODE_ENV === 'test' && credential === 'mock_credential';

    if (isTestCredential) {
      payload = {
        email: 'user@example.com',
        name: 'User Example',
        given_name: 'User',
        sub: 'google_test_id',
        email_verified: true,
      };
    } else {
      if (!env.GOOGLE_CLIENT_ID || !googleClient) {
        console.error('[GoogleLogin] GOOGLE_CLIENT_ID não configurado.');
        throw new AppError('Login Google indisponível.', 500);
      }
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload?.email) {
      throw new AppError('Email não encontrado no token Google.', 400);
    }

    if (payload.email_verified === false) {
      throw new AppError('Email Google não verificado.', 401);
    }

    const email = String(payload.email).toLowerCase();
    const nomeCompleto = payload.name || payload.given_name || email.split('@')[0];
    const nome = payload.given_name || nomeCompleto;
    const googleId = payload.sub;

    let user = await UserRepository.findByEmail(email);

    if (!user) {
      const loginCandidate = await buildUniqueLogin(email);
      const seedPassword = env.NODE_ENV === 'test' ? 'any_password' : crypto.randomBytes(32).toString('hex');
      const senhaHash = await bcrypt.hash(seedPassword, 10);

      await UserRepository.create({
        login: loginCandidate,
        senha_hash: senhaHash,
        perfil: 'user',
        ativo: false,
        status: 'pending',
        nome: nome || loginCandidate,
        nome_completo: nomeCompleto || loginCandidate,
        email,
        google_id: googleId,
        perfil_desejado: 'user',
      });

      return res.status(401).json({ message: 'Sua conta está pendente de aprovação.' });
    }

    if (normalizeStatus(user.status) === 'rejected') {
      return res.status(401).json({ message: 'Sua conta foi rejeitada.' });
    }

    if (isPendingStatus(user.status) || user.ativo === false) {
      return res.status(401).json({ message: 'Sua conta está pendente de aprovação.' });
    }

    const { data, error } = await supabasePublic.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    });

    if (error || !data?.session || !data?.user) {
      console.error('[GoogleLogin] Falha no Supabase:', error?.message || 'Sem sessão');
      throw new AppError('Falha ao autenticar com o Google.', 401);
    }

    const authUser = data.user;

    const updates: Record<string, any> = {};
    if (authUser?.id && authUser.id !== user.supabase_id) {
      updates.supabase_id = authUser.id;
    }
    if (googleId && googleId !== user.google_id) {
      updates.google_id = googleId;
    }
    if (Object.keys(updates).length > 0) {
      await UserRepository.update(user.id, updates);
    }

    const userResponse = { ...user, ...updates };
    // @ts-ignore
    delete userResponse.senha_hash;

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: userResponse,
    });
  },

  me: async (req: Request, res: Response) => {
    const userId = (req as any)['userId'];

    if (!userId) {
      throw new AppError('Usuário não identificado no contexto.', 401);
    }

    const user = await UserRepository.findById(Number(userId));
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const userResponse = { ...user };
    // @ts-ignore
    delete userResponse.senha_hash;

    return res.status(200).json({
      user: userResponse
    });
  },

  ssoLogin: async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de SSO não fornecido.' });
    }
    const token = authHeader.split(' ')[1];

    if (!env.SSO_SHARED_SECRET) {
      console.error('[SSO] SSO_SHARED_SECRET não configurado.');
      return res.status(500).json({ message: 'SSO não configurado.' });
    }

    try {
      const decoded = jwt.verify(token, env.SSO_SHARED_SECRET) as any;
      const { email } = decoded;

      if (!email) {
        return res.status(400).json({ message: 'Token SSO sem email.' });
      }

      // Find user
      const user = await UserRepository.findByEmail(email);

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado no SISGPO.' });
      }

      if (!user.ativo) {
        return res.status(403).json({ message: 'Usuário inativo.' });
      }

      if (!user.supabase_id) {
        return res.status(403).json({ message: 'Usuário sem vínculo Supabase.' });
      }

      // Generate Session Token
      const sessionToken = crypto.randomBytes(32).toString('hex');

      const sessionUser = {
        id: user.supabase_id,
        email: user.email,
        user_metadata: { nome: user.nome },
        app_metadata: {},
        aud: 'authenticated'
      };

      registerSession(sessionToken, sessionUser);

      return res.status(200).json({
        token: sessionToken,
        message: 'SSO Login realizado com sucesso.'
      });

    } catch (err: any) {
      console.error('[SSO] Erro na verificação do token:', err.message);
      return res.status(401).json({ message: 'Token SSO inválido ou expirado.' });
    }
  }
};

export = authController;
