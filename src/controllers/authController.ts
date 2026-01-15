import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
      throw new AppError('Login e senha são obrigatórios.', 400);
    }

    // PASSO 2: Segurança (Prevenção de Enumeração)
    // Tentamos o login diretamente no Supabase assumindo o login como email
    // Se o sistema usa username, o frontend deve enviar o email ou o backend deve ter uma estratégia 
    // que não revele se o usuário existe antes da senha.
    // Aqui, vamos tentar o login com o email fornecido (ou login se for email).

    // Tentativa direta no Supabase
    const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
      email: rawLogin,
      password: senha
    });

    if (authError) {
      console.warn(`[Auth] Falha login Supabase para ${rawLogin}: ${authError.message}`);
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

  googleLogin: async (req: Request, res: Response) => {
    throw new AppError('Google Login deve ser feito via Frontend Supabase Client nesta versao.', 501);
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
