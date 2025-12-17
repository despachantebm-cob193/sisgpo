import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

type AuthRequest = Request & {
  userId?: number | string;
  userPerfil?: string;
};

interface TokenPayload extends JwtPayload {
  id?: number | string;
  perfil?: string;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token nao fornecido. Acesso negado.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Token mal formatado.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalido ou expirado.' });
    }

    const payload = decoded as TokenPayload;
    req.userId = payload?.id;
    req.userPerfil = payload?.perfil;

    return next();
  });
};

export = authMiddleware;
