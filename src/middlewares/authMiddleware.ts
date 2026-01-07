import { NextFunction, Request, Response } from 'express';
// import jwt from 'jsonwebtoken'; // Legacy
import { supabaseAdmin } from '../config/supabase';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token nao fornecido. Acesso negado.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    return res.status(401).json({ message: 'Token mal formatado.' });
  }

  const token = parts[1];

  try {
    // 1. Validar Token via Supabase Auth
    // getUser valida o token verificando a assinatura e validade
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      // Fallback Opcional: Tentar validar como JWT legado (Se key ainda existir)
      // Por agora, assumimos migração total para segurança.
      return res.status(401).json({ message: 'Sessao expirada ou invalida (Supabase).' });
    }

    // 2. Mapear usuário do Auth para usuário do Sistema (Legado ID Int)
    // Busca por supabase_id vinculado
    let { data: sistemaUser } = await supabaseAdmin
      .from('usuarios')
      .select('id, perfil, status, ativo')
      .eq('supabase_id', user.id)
      .single();

    // Fallback: Tenta achar por email se ainda não tiver vinculado
    if (!sistemaUser && user.email) {
      const { data: byEmail } = await supabaseAdmin
        .from('usuarios')
        .select('id, perfil, status, ativo')
        .eq('email', user.email)
        .single();

      if (byEmail) {
        sistemaUser = byEmail;
        // Opcional: Auto-link aqui? Melhor deixar bootstrap ou login lidar com isso para consistência
      }
    }

    if (!sistemaUser) {
      return res.status(403).json({ message: 'Usuario autenticado mas sem cadastro no sistema.' });
    }

    if (!sistemaUser.ativo) {
      return res.status(403).json({ message: 'Conta desativada.' });
    }

    // Injeta dados no Request para os Controllers usarem
    req.userId = sistemaUser.id;
    req.userPerfil = sistemaUser.perfil;
    (req as any).authUserId = user.id; // ID do Supabase disponível se precisar

    return next();

  } catch (err) {
    console.error('Erro AuthMiddleware:', err);
    return res.status(500).json({ message: 'Erro interno de autenticacao.' });
  }
};

export = authMiddleware;
