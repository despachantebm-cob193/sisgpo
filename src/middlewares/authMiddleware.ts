import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
        // [FALLBACK] Tenta validar como Token SSO/Legado assinado via JWT_SECRET
        try {
          const JWT_SECRET = process.env.JWT_SECRET;
          if (!JWT_SECRET) throw new Error('JWT_SECRET missing');

          const decoded = jwt.verify(token, JWT_SECRET) as any;

          // Simula estrutura de usuário do Supabase para manter compatibilidade com o resto da função
          user = {
            id: decoded.sub ? `sso_${decoded.sub}` : `sso_email_${decoded.email}`,
            email: decoded.email,
            user_metadata: { full_name: decoded.nome },
            app_metadata: { provider: 'sso_integration' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          };

          console.log(`[AuthMiddleware] Autenticado via Token SSO para: ${user.email}`);

        } catch (jwtError) {
          return res.status(401).json({ message: 'Sessão expirada ou inválida (Supabase e JWT).' });
        }
      } else {
        user = supabaseUser;
      }
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
        // Check if it's the specific admin user and force update if not admin
        if (user.email === 'timbo.correa@gmail.com' && sistemaUser.perfil !== 'admin') {
          console.log(`[AuthMiddleware] Promoting existing user ${user.email} to ADMIN.`);
          await UserRepository.update(sistemaUser.id, { perfil: 'admin', ativo: true });
          sistemaUser.perfil = 'admin';
          sistemaUser.ativo = true;
        }

        // Auto-link: Atualiza o supabase_id para evitar buscas futuras por email
        // APENAS se for usuário Supabase real (com UUID válido)
        if (user.app_metadata?.provider !== 'sso_integration') {
          await UserRepository.update(sistemaUser.id, { supabase_id: user.id });
        }
      }
    }

    // 3. Auto-cadastro se não existir
    if (!sistemaUser) {
      console.log(`[AuthMiddleware] Novo usuário detectado (Supabase ID: ${user.id}). Auto-cadastrando como Pendente.`);
      try {
        const loginBase = user.email ? user.email.split('@')[0] : `user_${user.id.substring(0, 8)}`;
        const nomeCompleto = user.user_metadata?.full_name || user.user_metadata?.name || loginBase;

        sistemaUser = await UserRepository.create({
          supabase_id: user.app_metadata?.provider === 'sso_integration' ? null : user.id,
          email: user.email,
          login: loginBase,
          nome: nomeCompleto.split(' ')[0],
          nome_completo: nomeCompleto,
          perfil: user.email === 'timbo.correa@gmail.com' ? 'admin' : 'user',
          ativo: user.email === 'timbo.correa@gmail.com' ? true : false,
          status: user.email === 'timbo.correa@gmail.com' ? 'ativo' : 'pendente',
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
