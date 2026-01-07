import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase'; // Admin Client
// import { supabaseClient } from ... precisamos de um cliente anon para login de usuario comum?
// Para login com senha (signInWithPassword), idealmente usa-se a chave anonima pública.
// Vamos instanciar um cliente ad-hoc ou usar REST API simples, mas o SDK exige Url/Key.
// Como o backend é "privilegiado", podemos usar o Admin para TUDO exceto login password que exige contexto?
// Não, o Admin pode fazer tudo, mas signInWithPassword gera sessão para o user.
import { createClient } from '@supabase/supabase-js';

import AppError from '../utils/AppError';
import UserRepository from '../repositories/UserRepository';

// Cliente "Anon" para login de usuário (simulando frontend)
// Isso evita que loguemos como admin.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

const authController = {
  login: async (req: Request, res: Response) => {
    const { login, senha } = req.body as { login?: string; senha?: string };
    const rawLogin = typeof login === 'string' ? login.trim() : '';

    if (!rawLogin || !senha) {
      throw new AppError('Login e senha sao obrigatorios.', 400);
    }

    // 1. Achar usuário no DB Local para pegar o Email (se logou com username)
    // O Supabase Auth exige Email.
    let user = await UserRepository.findByLogin(rawLogin);
    if (!user) {
      user = await UserRepository.findByEmail(rawLogin);
    }

    if (!user) {
      throw new AppError('Credenciais invalidas.', 401);
    }

    if (!user.ativo) {
      throw new AppError('Conta desativada.', 403);
    }

    // 2. Tentar Login no Supabase Auth
    // Precisamos de email
    const emailLogin = user.email || `${user.login}@sisgpo.temp`; // Fallback arriscado, mas necessário se não tiver email real

    const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
      email: emailLogin,
      password: senha
    });

    if (authError) {
      console.warn(`[Auth] Falha login Supabase para ${emailLogin}: ${authError.message}`);
      throw new AppError('Credenciais invalidas ou erro de autenticacao.', 401);
    }

    const session = authData.session;
    const userAuth = authData.user;

    // 3. Sync ID se necessário
    if (user.id && !user.supabase_id && userAuth) {
      await UserRepository.update(user.id, { supabase_id: userAuth.id });
    }

    // Retorna Token Supabase + Dados User legado (frontend espera objeto 'user')
    const userResponse = { ...user };
    delete (userResponse as any).senha_hash;

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

  // Endpoint para recuperar dados do user baseado no token (GET /me)
  me: async (req: Request, res: Response) => {
    const userId = (req as any).userId as number | undefined;

    if (!userId) {
      throw new AppError('Usuario nao identificado no contexto.', 401);
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const userResponse = { ...user };
    delete (userResponse as any).senha_hash;

    return res.status(200).json({
      user: userResponse
    });
  },

  googleLogin: async (req: Request, res: Response) => {
    throw new AppError('Google Login deve ser feito via Frontend Supabase Client nesta versao.', 501);
  },

  ssoLogin: async (req: Request, res: Response) => {
    throw new AppError('SSO Login deve ser feito via Frontend Supabase Client nesta versao.', 501);
  }
};

export = authController;
