import { Request, RequestHandler } from 'express';
import AppError from '../utils/AppError';

const ensureAdmin: RequestHandler = (req: Request, _res, next) => {
  const perfil = (req.userPerfil || '').toLowerCase();

  if (perfil !== 'admin' && perfil !== 'administrador') {
    throw new AppError('Acesso restrito a administradores.', 403);
  }

  return next();
};

export = ensureAdmin;
