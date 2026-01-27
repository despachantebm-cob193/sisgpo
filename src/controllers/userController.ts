
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError';
import { supabaseAdmin } from '../config/supabase';
import UserRepository, { UserRow } from '../repositories/UserRepository';
import {
  ChangePasswordDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateUserStatusDTO,
} from '../validators/userValidator';

const sanitizeUser = (user: UserRow) => ({
  id: user.id,
  login: user.login,
  perfil: user.perfil,
  ativo: user.ativo,
  status: user.status,
  nome_completo: user.nome_completo,
  nome: user.nome,
  email: user.email,
  whatsapp: user.whatsapp,
  unidade: user.unidade,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const userController = {
  getPending: async (_req: Request, res: Response) => {
    const users = await UserRepository.findPending();
    return res.status(200).json({ users: users.map(sanitizeUser) });
  },

  approve: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);
    const adminId = (req as any).userId as number | undefined;

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const perfilAprovado = user.perfil_desejado || user.perfil || 'user';

    await UserRepository.update(userId, {
      status: 'approved',
      perfil: perfilAprovado,
      ativo: true,
      aprovado_por: adminId ?? null,
      aprovado_em: new Date(),
    });

    return res.status(200).json({ message: 'Usuario aprovado com sucesso!' });
  },

  reject: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    await UserRepository.update(userId, { status: 'rejected', ativo: false });
    return res.status(200).json({ message: 'Usuario rejeitado com sucesso!' });
  },

  changePassword: async (req: Request, res: Response) => {
    const { senhaAtual, novaSenha } = req.body as Partial<ChangePasswordDTO>;
    const userId = (req as any).userId as number | undefined;

    if (!userId) {
      throw new AppError('Usuario nao autenticado.', 401);
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const isPasswordValid = user.senha_hash ? await bcrypt.compare(senhaAtual || '', user.senha_hash) : false;
    if (!isPasswordValid) {
      throw new AppError('Senha atual incorreta.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha || '', salt);

    await UserRepository.update(userId, { senha_hash: novaSenhaHash });

    return res.status(200).json({ message: 'Senha alterada com sucesso!' });
  },

  getAll: async (_req: Request, res: Response) => {
    const users = await UserRepository.findAll();
    return res.status(200).json({
      users: users.map(sanitizeUser),
    });
  },

  create: async (req: Request, res: Response) => {
    const { login, senha, perfil, nome_completo, nome, email } = req.body as CreateUserDTO;
    const trimmedLogin = login.trim();
    const trimmedNome = nome.trim();
    const trimmedNomeCompleto = nome_completo.trim();
    const trimmedEmail = email.trim();
    const normalizedPerfil = perfil.trim().toLowerCase();

    const loginExists = await UserRepository.exists('login', trimmedLogin);
    if (loginExists) {
      throw new AppError('Login ja esta em uso.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const newUser = await UserRepository.create({
      login: trimmedLogin,
      senha_hash: senhaHash,
      perfil: normalizedPerfil,
      ativo: true,
      nome_completo: trimmedNomeCompleto,
      nome: trimmedNome,
      email: trimmedEmail.toLowerCase(),
      status: 'approved', // Criado por admin já nasce aprovado
    });

    return res.status(201).json({
      message: 'Usuario criado com sucesso!',
      user: sanitizeUser(newUser),
    });
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { login, perfil, senha, nome_completo, nome, email } = req.body as UpdateUserDTO;
    const userId = Number(id);

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const updatePayload: Partial<UserRow> = {};
    const trimmedLogin = typeof login === 'string' ? login.trim() : undefined;
    const trimmedNome = typeof nome === 'string' ? nome.trim() : undefined;
    const trimmedNomeCompleto = typeof nome_completo === 'string' ? nome_completo.trim() : undefined;
    const trimmedEmail = typeof email === 'string' ? email.trim() : undefined;

    if (trimmedLogin && trimmedLogin !== user.login) {
      const loginInUse = await UserRepository.exists('login', trimmedLogin, userId);
      if (loginInUse) {
        throw new AppError('Login informado ja esta em uso.', 409);
      }
      updatePayload.login = trimmedLogin;
    }

    const normalizedPerfil = typeof perfil === 'string' ? perfil.trim().toLowerCase() : undefined;
    if (normalizedPerfil) {
      updatePayload.perfil = normalizedPerfil;
    }

    if (trimmedNomeCompleto) updatePayload.nome_completo = trimmedNomeCompleto;
    if (trimmedNome) updatePayload.nome = trimmedNome;

    if (trimmedEmail && trimmedEmail.toLowerCase() !== (user.email || '').toLowerCase()) {
      const emailInUse = await UserRepository.exists('email', trimmedEmail, userId);
      if (emailInUse) {
        throw new AppError('Email informado ja esta em uso.', 409);
      }
      updatePayload.email = trimmedEmail;
    }

    if (typeof senha === 'string' && senha.trim()) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.senha_hash = await bcrypt.hash(senha, salt);
    }

    const body = req.body as Partial<UpdateUserStatusDTO>;
    if (typeof body.ativo === 'boolean') {
      updatePayload.ativo = body.ativo;
    }

    let updatedUser = user;
    if (Object.keys(updatePayload).length > 0) {
      updatedUser = await UserRepository.update(userId, updatePayload);
    }

    return res.status(200).json({
      message: 'Usuario atualizado com sucesso!',
      user: sanitizeUser(updatedUser),
    });
  },

  toggleActive: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const novoStatus = !user.ativo;
    await UserRepository.update(userId, { ativo: novoStatus });

    return res.status(200).json({
      message: novoStatus ? 'Usuario ativado com sucesso!' : 'Usuario desativado com sucesso!',
    });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);

    // 1. Busca o usuário para obter o supabase_id antes de deletar
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    // 2. Se o usuário tiver um ID no Supabase Auth, deleta lá também
    if (user.supabase_id) {
      console.log(`[Admin] Removendo usuário ${user.email} do Supabase Auth (${user.supabase_id})...`);
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.supabase_id);

      if (authError) {
        console.error(`[Admin] Erro ao deletar no Auth: ${authError.message}`);
      }
    }

    // 3. Deleta do banco de dados local (tabela usuarios)
    const success = await UserRepository.delete(userId);
    if (!success) {
      throw new AppError('Erro ao deletar usuario do banco de dados.', 500);
    }

    return res.status(204).send();
  },
};

export = userController;
