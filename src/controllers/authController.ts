import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

import AppError from '../utils/AppError';
import UserRepository from '../repositories/UserRepository';
import { supabaseAdmin } from '../config/supabase';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

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

    if (!user.ativo) {
      throw new AppError('Conta desativada ou aguardando aprovação.', 403);
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

  me: async (req: Request, res: Response) => {
    const userId = req.userId;

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
  }
};

export = authController;
