import { NextFunction, Request, Response } from 'express';
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

    const cached = authCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      user = cached.user;
    } else {
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !supabaseUser) {
        return res.status(401).json({ message: 'Sessão expirada ou inválida.' });
      } else {
        user = supabaseUser;
      }
      authCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL });
    }

    // Mapear usuário do Auth para usuário do Sistema
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

      if (byEmail) {
        sistemaUser = byEmail;
        // Auto-link: Atualiza o supabase_id para evitar buscas futuras por email
        await UserRepository.update(sistemaUser.id, { supabase_id: user.id });
      }
    }

    if (!sistemaUser) {
      return res.status(403).json({ message: 'Usuário autenticado mas sem cadastro no sistema local.' });
    }

    if (!sistemaUser.ativo) {
      return res.status(403).json({ message: 'USER_PENDING_APPROVAL' });
    }

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
