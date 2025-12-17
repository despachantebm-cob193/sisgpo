type Env = {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URLS: string[];
  ALLOW_RENDER_ORIGINS: boolean;
  JWT_SECRET: string;
  SSO_AUDIENCE?: string;
  SSO_ISSUER?: string;
  SSO_ALGORITHM?: string;
  SSO_TOKEN_TTL_SECONDS?: number;
  DB: {
    URL?: string;
    HOST?: string;
    USER?: string;
    PASSWORD?: string;
    NAME?: string;
    PORT?: number;
    SSL: boolean;
  };
  EXTERNAL_DB?: {
    HOST?: string;
    USER?: string;
    PASSWORD?: string;
    NAME?: string;
    PORT?: number;
    SSL: boolean;
  };
  OCORRENCIAS_API_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
};

const parseNumber = (value?: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

export const env: Env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseNumber(process.env.PORT)?.valueOf() || 3333,
  FRONTEND_URLS: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean) : [],
  ALLOW_RENDER_ORIGINS: process.env.ALLOW_RENDER_ORIGINS !== 'false',
  JWT_SECRET: process.env.JWT_SECRET || '',
  SSO_AUDIENCE: process.env.SSO_AUDIENCE,
  SSO_ISSUER: process.env.SSO_ISSUER,
  SSO_ALGORITHM: process.env.SSO_ALGORITHM,
  SSO_TOKEN_TTL_SECONDS: parseNumber(process.env.SSO_TOKEN_TTL_SECONDS),
  DB: {
    URL: process.env.DATABASE_URL,
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_DATABASE || process.env.DB_NAME,
    PORT: parseNumber(process.env.DB_PORT),
    SSL: parseBoolean(process.env.DB_SSL, (process.env.NODE_ENV === 'production') || Boolean(process.env.DATABASE_URL)),
  },
  EXTERNAL_DB: process.env.EXTERNAL_DB_HOST
    ? {
        HOST: process.env.EXTERNAL_DB_HOST,
        USER: process.env.EXTERNAL_DB_USER,
        PASSWORD: process.env.EXTERNAL_DB_PASSWORD,
        NAME: process.env.EXTERNAL_DB_NAME || process.env.EXTERNAL_DB_DATABASE,
        PORT: parseNumber(process.env.EXTERNAL_DB_PORT),
        SSL: parseBoolean(process.env.EXTERNAL_DB_SSL, (process.env.EXTERNAL_DB_HOST || '').includes('neon.tech')),
      }
    : undefined,
  OCORRENCIAS_API_URL: process.env.OCORRENCIAS_API_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
};

export default env;
