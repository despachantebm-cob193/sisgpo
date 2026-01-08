import { NextFunction, Request, Response } from 'express';
// import jwt from 'jsonwebtoken'; // Legacy
import { supabaseAdmin } from '../config/supabase';
import UserRepository from '../repositories/UserRepository';

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
      console.log(`[AuthMiddleware] Novo usu\u00e1rio detectado (Supabase ID: ${user.id}). Auto-cadastrando como Pendente.`);
      try {
        // Tenta extrair um login do metadata ou email
        const loginBase = user.email ? user.email.split('@')[0] : `user_${user.id.substring(0, 8)}`;
        const nomeCompleto = user.user_metadata?.full_name || user.user_metadata?.name || loginBase;

        console.log('[AuthMiddleware] Auto-cadastrando usuario:', { login: loginBase, email: user.email });

        sistemaUser = await UserRepository.create({
          supabase_id: user.id,
          email: user.email,
          login: loginBase,
          nome: nomeCompleto.split(' ')[0], // Primeiro nome
          nome_completo: nomeCompleto,
          perfil: 'user', // "visitante" não é válido no validator/schema? Usando "user" inativo.
          ativo: false,
          status: 'pendente',
          senha_hash: 'SUPABASE_MANAGED_ACCOUNT' // Workaround para Constraint NOT NULL do legado
        });
      } catch (createErr) {
        console.error('[AuthMiddleware] Erro ao auto-cadastrar usuario. Detalhes:', createErr);
        if (createErr instanceof Error) {
          console.error('Stack:', createErr.stack);
        }
        return res.status(500).json({ message: 'Erro ao registrar novo usuario no sistema.' });
      }
    }

    if (!sistemaUser) {
      return res.status(403).json({ message: 'Usuario autenticado mas sem cadastro no sistema.' });
    }

    if (!sistemaUser.ativo) {
      // Retorna código específico para frontend tratar como "Aguardando Aprovação"
      console.log(`[AuthMiddleware] Usuario ${sistemaUser.login} (ID: ${sistemaUser.id}) esta com ATIVO=${sistemaUser.ativo}. Retornando 403 USER_PENDING_APPROVAL`);
      return res.status(403).json({ message: 'USER_PENDING_APPROVAL' });
    }

    // Injeta dados no Request para os Controllers usarem
    req.userId = sistemaUser.id;
    req.userPerfil = sistemaUser.perfil;
    (req as any).authUserId = user.id; // ID do Supabase disponível se precisar

    return next();

  } catch (err) {
    console.error('Erro Fatal AuthMiddleware:', err);
    if (err instanceof Error) {
      console.error('Stack:', err.stack);
    }
    return res.status(500).json({ message: 'Erro interno de autenticacao.' });
  }
};

export = authMiddleware;
