import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase'; // Admin Client
// import { supabaseClient } from ... precisamos de um cliente anon para login de usuario comum?
// Para login com senha (signInWithPassword), idealmente usa-se a chave anonima pública.
// Vamos instanciar um cliente ad-hoc ou usar REST API simples, mas o SDK exige Url/Key.
// Como o backend é "privilegiado", podemos usar o Admin para TUDO exceto login password que exige contexto?
// Não, o Admin pode fazer tudo, mas signInWithPassword gera sessão para o user.
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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
      throw new AppError('Login e senha são obrigatórios.', 400);
    }

    // PASSO 2: Segurança (Prevenção de Enumeração)
    // Resolva o email real a partir do login, mas sem vazar a existência do usuário.
    const userByEmail = await UserRepository.findByEmail(rawLogin);
    const userByLogin = userByEmail ? null : await UserRepository.findByLogin(rawLogin);
    const candidateUser = userByEmail || userByLogin;
    const candidateEmail = userByEmail?.email || userByLogin?.email || rawLogin;

    // Tentativas de login no Supabase (email deduzido + valor informado)
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

    // Fallback de migração: se o usuário existir no banco legado e a senha bater, cria/atualiza no Auth e tenta de novo.
    if (!authData && candidateUser?.senha_hash && candidateUser?.email) {
      const senhaConfere = await bcrypt.compare(senha, candidateUser.senha_hash);
      if (senhaConfere) {
        if (candidateUser.supabase_id) {
          // Atualiza senha do usuário já existente no Auth
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(candidateUser.supabase_id, {
            password: senha,
            email: candidateUser.email,
            email_confirm: true,
            user_metadata: { login: candidateUser.login }
          });
          if (updateError) {
            console.warn('[Auth] Falha ao atualizar senha no Auth:', updateError.message);
          } else {
            console.log(`[Auth] Senha atualizada no Auth para ${candidateUser.email}.`);
          }
        } else {
          // Cria usuário no Auth e vincula ao legado
          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: candidateUser.email,
            password: senha,
            email_confirm: true,
            user_metadata: { login: candidateUser.login }
          });

          if (createError) {
            console.warn('[Auth] Falha ao criar usuário no Auth:', createError.message);
          } else {
            console.log(`[Auth] Usuário ${candidateUser.email} criado no Supabase Auth via fallback.`);
            if (created?.user?.id && candidateUser.id) {
              await UserRepository.update(candidateUser.id, { supabase_id: created.user.id });
              loginCandidates.unshift(candidateUser.email); // garante tentativa com email correto
            }
          }
        }

        await trySupabaseSignIn();
      }
    }

    if (!authData) {
      console.warn(`[Auth] Falha login Supabase para ${rawLogin}: ${lastError?.message || 'unknown'}`);
      // Resposta genérica para evitar enumeração
      throw new AppError('Credenciais inválidas.', 401);
    }

    const session = authData.session;
    const userAuth = authData.user;

    if (!userAuth) {
      throw new AppError('Erro na autenticação.', 401);
    }

    // Só após sucesso no Supabase buscamos os dados no DB Local
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

    // Sync ID se necessário
    if (user.id && !user.supabase_id) {
      await UserRepository.update(user.id, { supabase_id: userAuth.id });
    }

    // Retorna Token Supabase + Dados User legado (frontend espera objeto 'user')
    const userResponse = { ...user };
    // @ts-ignore - senha_hash pode não estar no tipo mas estar no objeto vindo do DB
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

  // Endpoint para recuperar dados do user baseado no token (GET /me)
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
  },

  ssoLogin: async (req: Request, res: Response) => {
    // O middleware ssoAuthMiddleware já validou o token compartilhado e injetou o payload em req.ssoPayload
    const payload = (req as any).ssoPayload;

    if (!payload || !payload.email) {
      throw new AppError('Payload SSO inválido: email não encontrado.', 400);
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new AppError('Servidor mal configurado: JWT_SECRET ausente.', 500);
    }

    // Gera um token interno do SISGPO para essa sessão
    // Esse token deve ser aceito pelo authMiddleware
    const token = jwt.sign(
      {
        email: payload.email,
        sub: payload.sub, // ID do usuário no sistema de origem (opcional)
        nome: payload.nome,
        type: 'sso_integration'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ token });
  }
};

export = authController;
