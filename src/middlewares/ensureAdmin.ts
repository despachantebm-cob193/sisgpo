import { Request, RequestHandler } from 'express';
import AppError from '../utils/AppError';

type AuthenticatedRequest = Request & {
  userPerfil?: string;
};

const ensureAdmin: RequestHandler = (req: AuthenticatedRequest, _res, next) => {
  const perfil = (req.userPerfil || '').toLowerCase();

  if (perfil !== 'admin') {
    throw new AppError('Acesso restrito a administradores.', 403);
  }

  return next();
};

export = ensureAdmin;
