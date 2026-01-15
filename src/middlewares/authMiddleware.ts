import { NextFunction, Request, Response } from 'express';
// import jwt from 'jsonwebtoken'; // Legacy
import { supabaseAdmin } from '../config/supabase';
import UserRepository from '../repositories/UserRepository';

const authCache = new Map<string, { user: any; expiresAt: number }>();
const CACHE_TTL = 60 * 1000; // 60 segundos

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido. Acesso negado.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    return res.status(401).json({ message: 'Token mal formatado.' });
  }

  const token = parts[1];

  try {
    let user;

    // PASSO 3: Performance (Caching)
    const cached = authCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      user = cached.user;
    } else {
      // 1. Validar Token via Supabase Auth
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !supabaseUser) {
        return res.status(401).json({ message: 'Sessão expirada ou inválida (Supabase).' });
      }

      user = supabaseUser;
      // Salva no cache
      authCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL });

      // Limpeza periódica simples do cache
      if (authCache.size > 1000) {
        const now = Date.now();
        for (const [key, val] of authCache.entries()) {
          if (val.expiresAt < now) authCache.delete(key);
        }
      }
    }

    // 2. Mapear usuário do Auth para usuário do Sistema (Legado ID Int)
    // Busca por supabase_id vinculado
    let { data: sistemaUser } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('supabase_id', user.id)
      .single();

    // Fallback: Tenta achar por email se ainda não tiver vinculado
    if (!sistemaUser && user.email) {
      const { data: byEmail } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single();

      console.log(`[AuthMiddleware] Fallback por email para ${user.email}: ${byEmail ? 'ENCONTRADO' : 'NAO ENCONTRADO'}`);

      if (byEmail) {
        sistemaUser = byEmail;
        // Auto-link: Atualiza o supabase_id para evitar buscas futuras por email
        await UserRepository.update(sistemaUser.id, { supabase_id: user.id });
      }
    }

    // 3. Auto-cadastro se não existir
    if (!sistemaUser) {
      console.log(`[AuthMiddleware] Novo usuário detectado (Supabase ID: ${user.id}). Auto-cadastrando como Pendente.`);
      try {
        const loginBase = user.email ? user.email.split('@')[0] : `user_${user.id.substring(0, 8)}`;
        const nomeCompleto = user.user_metadata?.full_name || user.user_metadata?.name || loginBase;

        sistemaUser = await UserRepository.create({
          supabase_id: user.id,
          email: user.email,
          login: loginBase,
          nome: nomeCompleto.split(' ')[0],
          nome_completo: nomeCompleto,
          perfil: 'user',
          ativo: false,
          status: 'pendente',
          senha_hash: 'SUPABASE_MANAGED_ACCOUNT'
        });
      } catch (createErr) {
        console.error('[AuthMiddleware] Erro ao auto-cadastrar usuário:', createErr);
        return res.status(500).json({ message: 'Erro ao registrar novo usuário no sistema.' });
      }
    }

    if (!sistemaUser) {
      return res.status(403).json({ message: 'Usuário autenticado mas sem cadastro no sistema.' });
    }

    if (!sistemaUser.ativo) {
      return res.status(403).json({ message: 'USER_PENDING_APPROVAL' });
    }

    // Injeta dados no Request (PASSO 1: Tipagem Correta)
    req.userId = sistemaUser.id;
    req.userPerfil = sistemaUser.perfil;
    req.authUserId = user.id;

    return next();

  } catch (err) {
    console.error('Erro Fatal AuthMiddleware:', err);
    return res.status(500).json({ message: 'Erro interno de autenticação.' });
  }
};

export = authMiddleware;
