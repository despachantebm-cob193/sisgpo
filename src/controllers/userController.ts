import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database';
import AppError from '../utils/AppError';

type UserRecord = {
  id?: number;
  login: string;
  senha_hash?: string;
  perfil?: string;
  ativo?: boolean;
  status?: string;
  nome_completo?: string | null;
  nome?: string | null;
  email?: string | null;
  created_at?: Date;
  updated_at?: Date;
  perfil_desejado?: string | null;
  aprovado_por?: number | null;
  aprovado_em?: Date | null;
};

const sanitizeUser = (user: UserRecord) => ({
  id: user.id,
  login: user.login,
  perfil: user.perfil,
  ativo: user.ativo,
  status: user.status,
  nome_completo: user.nome_completo,
  nome: user.nome,
  email: user.email,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const getDbClient = () => (db as any).client?.config?.client as string | undefined;
const isLiteClient = () => {
  const client = getDbClient();
  return client && ['sqlite3', 'better-sqlite3', 'sqlite'].includes(client);
};

const fetchAllUsers = async () => {
  const users = await db<UserRecord>('usuarios').select('*').orderBy('login', 'asc');
  return users.map(sanitizeUser);
};

const userController = {
  getPending: async (_req: Request, res: Response) => {
    const users = await db<UserRecord>('usuarios').where({ status: 'pending' }).select('*');
    return res.status(200).json({ users: users.map(sanitizeUser) });
  },

  approve: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);
    const adminId = (req as any).userId as number | undefined;

    const user = await db<UserRecord>('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const perfilAprovado = user.perfil_desejado || user.perfil || 'user';

    await db('usuarios')
      .where({ id: userId })
      .update({
        status: 'approved',
        perfil: perfilAprovado,
        aprovado_por: adminId ?? null,
        aprovado_em: db.fn.now(),
      });

    return res.status(200).json({ message: 'Usuario aprovado com sucesso!' });
  },

  reject: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);

    const user = await db<UserRecord>('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    await db('usuarios').where({ id: userId }).update({ status: 'rejected' });

    return res.status(200).json({ message: 'Usuario rejeitado com sucesso!' });
  },

  changePassword: async (req: Request, res: Response) => {
    const { senhaAtual, novaSenha } = req.body as { senhaAtual?: string; novaSenha?: string };
    const userId = (req as any).userId as number | undefined;

    if (!userId) {
      throw new AppError('Usuario nao autenticado.', 401);
    }

    const user = await db<UserRecord>('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const isPasswordValid = user.senha_hash ? await bcrypt.compare(senhaAtual || '', user.senha_hash) : false;
    if (!isPasswordValid) {
      throw new AppError('Senha atual incorreta.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha || '', salt);

    await db('usuarios')
      .where({ id: userId })
      .update({
        senha_hash: novaSenhaHash,
        updated_at: db.fn.now(),
      });

    return res.status(200).json({ message: 'Senha alterada com sucesso!' });
  },

  getAll: async (_req: Request, res: Response) => {
    const users = await fetchAllUsers();

    return res.status(200).json({
      users,
    });
  },

  create: async (req: Request, res: Response) => {
    const { login, senha, perfil, nome_completo, nome, email } = req.body as {
      login: string;
      senha: string;
      perfil: string;
      nome_completo: string;
      nome: string;
      email: string;
    };
    const trimmedLogin = login.trim();
    const trimmedNome = nome.trim();
    const trimmedNomeCompleto = nome_completo.trim();
    const trimmedEmail = email.trim();
    const normalizedPerfil = perfil.trim().toLowerCase();

    const existingUser = await db<UserRecord>('usuarios').where({ login: trimmedLogin }).first();
    if (existingUser) {
      throw new AppError('Login ja esta em uso.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const insertPayload: UserRecord = {
      login: trimmedLogin,
      senha_hash: senhaHash,
      perfil: normalizedPerfil,
      ativo: true,
      nome_completo: trimmedNomeCompleto,
      nome: trimmedNome,
      email: trimmedEmail.toLowerCase(),
    };

    let createdUserRecord: UserRecord;

    if (isLiteClient()) {
      const insertedIds = await db('usuarios').insert(insertPayload as any);
      const newId = Array.isArray(insertedIds) ? insertedIds[0] : insertedIds;
      createdUserRecord = (await db<UserRecord>('usuarios').where({ id: newId }).first()) as UserRecord;
    } else {
      const insertedRows = await db<UserRecord>('usuarios').insert(insertPayload as any).returning('*');
      createdUserRecord = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows;
    }

    return res.status(201).json({
      message: 'Usuario criado com sucesso!',
      user: sanitizeUser(createdUserRecord),
    });
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { login, perfil, senha, nome_completo, nome, email } = req.body as Partial<UserRecord> & { senha?: string };
    const userId = Number(id);

    const user = await db<UserRecord>('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const updatePayload: Partial<UserRecord> & { updated_at: any; senha_hash?: string } = {
      updated_at: db.fn.now() as any,
    };
    const trimmedLogin = typeof login === 'string' ? login.trim() : undefined;
    const trimmedNome = typeof nome === 'string' ? nome.trim() : undefined;
    const trimmedNomeCompleto = typeof nome_completo === 'string' ? nome_completo.trim() : undefined;
    const trimmedEmail = typeof email === 'string' ? email.trim() : undefined;

    if (trimmedLogin && trimmedLogin !== user.login) {
      const loginInUse = await db<UserRecord>('usuarios')
        .where({ login: trimmedLogin })
        .whereNot({ id: userId })
        .first();
      if (loginInUse) {
        throw new AppError('Login informado ja esta em uso.', 409);
      }
      updatePayload.login = trimmedLogin;
    }

    const normalizedPerfil = typeof perfil === 'string' ? perfil.trim().toLowerCase() : undefined;
    if (normalizedPerfil) {
      updatePayload.perfil = normalizedPerfil;
    }

    if (trimmedNomeCompleto && trimmedNomeCompleto !== (user.nome_completo ?? '')) {
      updatePayload.nome_completo = trimmedNomeCompleto;
    }
    if (trimmedNome && trimmedNome !== (user.nome ?? '')) {
      updatePayload.nome = trimmedNome;
    }
    if (trimmedEmail && trimmedEmail.toLowerCase() !== (user.email ?? '').toLowerCase()) {
      const emailInUse = await db<UserRecord>('usuarios')
        .whereRaw('LOWER(email) = ?', [trimmedEmail.toLowerCase()])
        .whereNot({ id: userId })
        .first();
      if (emailInUse) {
        throw new AppError('Email informado ja esta em uso.', 409);
      }
      updatePayload.email = trimmedEmail;
    }

    if (typeof senha === 'string' && senha.trim()) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.senha_hash = await bcrypt.hash(senha, salt);
    }

    const isAtivoBool = typeof (req.body as any).ativo === 'boolean' ? (req.body as any).ativo : undefined;
    if (typeof isAtivoBool === 'boolean') {
      updatePayload.ativo = isAtivoBool;
    }

    await db('usuarios').where({ id: userId }).update(updatePayload);
    const updatedUser = await db<UserRecord>('usuarios').where({ id: userId }).first();

    return res.status(200).json({
      message: 'Usuario atualizado com sucesso!',
      user: sanitizeUser(updatedUser as UserRecord),
    });
  },

  toggleActive: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);

    const user = await db<UserRecord>('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const novoStatus = !user.ativo;
    await db('usuarios')
      .where({ id: userId })
      .update({ ativo: novoStatus, updated_at: db.fn.now() });

    return res.status(200).json({
      message: novoStatus ? 'Usuario ativado com sucesso!' : 'Usuario desativado com sucesso!',
    });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = Number(id);
    const deletado = await db('usuarios').where({ id: userId }).del();
    if (deletado === 0) {
      throw new AppError('Usuario nao encontrado.', 404);
    }
    return res.status(204).send();
  },
};

export = userController;
