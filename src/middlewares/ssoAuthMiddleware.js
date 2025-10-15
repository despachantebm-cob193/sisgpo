// api/src/middleware/ssoAuthMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Use uma variável de ambiente para o segredo compartilhado em produção
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'seu-segredo-compartilhado';

export const ssoAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticação não fornecido ou mal formatado.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, SSO_SHARED_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token de autenticação inválido.' });
  }
};