import jwt, { Algorithm, JwtPayload } from 'jsonwebtoken';
import env from '../config/env';

export interface SignSsoOptions {
  audience?: string;
  issuer?: string;
  expiresInSeconds?: number;
  additionalClaims?: JwtPayload;
  headers?: Record<string, string>;
}

const DEFAULT_AUDIENCE = env.OCORRENCIAS_API_URL ? 'ocorrencias' : env.SSO_AUDIENCE || 'ocorrencias';
const DEFAULT_ISSUER = env.SSO_ISSUER || 'sisgpo';
const DEFAULT_ALGORITHM: Algorithm = (env.SSO_ALGORITHM as Algorithm) || 'HS256';
const DEFAULT_EXPIRES_IN_SECONDS = Number(env.SSO_TOKEN_TTL_SECONDS ?? 120);

function getSharedSecret(): string {
  const secret = process.env.SSO_SHARED_SECRET;
  if (!secret) {
    throw new Error('SSO_SHARED_SECRET is not defined. Configure it in the environment before issuing SSO tokens.');
  }
  return secret;
}

export function signSsoJwt(options: SignSsoOptions = {}): string {
  const secret = getSharedSecret();

  const audience = options.audience || DEFAULT_AUDIENCE;
  const issuer = options.issuer || DEFAULT_ISSUER;
  const expiresInSeconds =
    typeof options.expiresInSeconds === 'number' ? options.expiresInSeconds : DEFAULT_EXPIRES_IN_SECONDS;

  const payload: JwtPayload = {
    system: issuer,
    ...(options.additionalClaims || {}),
  };

  return jwt.sign(payload, secret, {
    algorithm: DEFAULT_ALGORITHM,
    audience,
    issuer,
    expiresIn: expiresInSeconds,
  });
}

export function buildSsoAuthHeaders(options: SignSsoOptions = {}): Record<string, string> {
  const headers = options.headers ? { ...options.headers } : {};
  const token = signSsoJwt(options);
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export function withSsoAuth(config: Record<string, any> = {}, options: SignSsoOptions = {}) {
  const headers = buildSsoAuthHeaders({ ...options, headers: config.headers });
  return {
    ...config,
    headers,
  };
}

export default signSsoJwt;
