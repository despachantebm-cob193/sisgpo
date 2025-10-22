import type { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Config via ENV
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET;            // obrigatório (HS256)
const EXPECTED_ISSUER   = process.env.SSO_ISSUER   || 'sisgpo';
const EXPECTED_AUDIENCE = process.env.SSO_AUDIENCE || 'ocorrencias';
const EXPECTED_ALG      = (process.env.SSO_ALG || 'HS256') as jwt.Algorithm; // HS256 por padrão

export interface RequestWithSso extends Request {
  ssoPayload?: JwtPayload | string;
}

export const verifySsoJwt = (req: Request, res: Response, next: NextFunction): void => {
  // Falta de config crítica
  if (!SSO_SHARED_SECRET) {
    res.status(500).json({ message: 'SSO configuration missing on servidor de ocorrencias.' });
    return;
  }

  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'SSO token ausente ou mal formatado.' });
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = jwt.verify(token, SSO_SHARED_SECRET, {
      algorithms: [EXPECTED_ALG],        // garante algoritmo esperado
      audience: EXPECTED_AUDIENCE,
      issuer: EXPECTED_ISSUER,
      clockTolerance: 5,                 // tolerância de relógio (segundos)
      // maxAge: '1h',                   // (opcional) limite de idade do token
    }) as JwtPayload | string;

    (req as RequestWithSso).ssoPayload = payload;
    next();
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError
        ? 'SSO token expirado.'
        : 'SSO token inválido.';
    res.status(401).json({ message });
  }
};

export default verifySsoJwt;