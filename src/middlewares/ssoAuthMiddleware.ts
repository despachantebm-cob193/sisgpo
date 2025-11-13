// api/src/middleware/ssoAuthMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Use uma variável de ambiente para o segredo compartilhado em produção
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'seu-segredo-compartilhado';

export interface RequestWithSso extends Request {
  ssoPayload?: JwtPayload | string;
}

export const ssoAuthMiddleware = (req: RequestWithSso, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticação não fornecido ou mal formatado.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, SSO_SHARED_SECRET);
    (req as RequestWithSso).ssoPayload = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token de autenticação inválido.' });
  }
};
