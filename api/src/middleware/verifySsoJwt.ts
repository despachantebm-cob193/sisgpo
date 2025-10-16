import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET;
const EXPECTED_ISSUER = process.env.SSO_ISSUER || 'sisgpo';
const EXPECTED_AUDIENCE = process.env.SSO_AUDIENCE || 'ocorrencias';

export interface RequestWithSso extends Request {
  ssoPayload?: JwtPayload | string;
}

export const verifySsoJwt = (req: Request, res: Response, next: NextFunction): void => {
  if (!SSO_SHARED_SECRET) {
    res
      .status(500)
      .json({ message: 'SSO configuration missing on servidor de ocorrencias.' });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'SSO token ausente ou mal formatado.' });
    return;
  }

  const token = authHeader.substring('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, SSO_SHARED_SECRET, {
      audience: EXPECTED_AUDIENCE,
      issuer: EXPECTED_ISSUER,
    });

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
