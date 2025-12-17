// src/config/database.js

require('dotenv').config();
const knex = require('knex');
const path = require('path');
const env = require('./env').default || require('./env');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalized);
};

const parsePort = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const port = Number(value);
  return Number.isFinite(port) ? port : undefined;
};

const sanitizeConnectionConfig = (config) => {
  return Object.entries(config).reduce((result, [key, entryValue]) => {
    if (entryValue === undefined || entryValue === null || entryValue === '') {
      return result;
    }
    result[key] = entryValue;
    return result;
  }, {});
};

const isCloudPrimary =
  env.NODE_ENV === 'production' ||
  ((env.DB.HOST || env.DB.URL || '').includes('neon.tech'));

const createDbInstance = (connectionConfig, options = {}) => {
  const {
    isExternal = false,
    useSsl = false,
    migrations,
    seeds,
  } = options;

  const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

  const poolMin = parseInt(process.env.DB_POOL_MIN, 10);
  const poolMax = parseInt(process.env.DB_POOL_MAX, 10);

  const baseConfig = {
    client: 'pg',
    connection: {
      ...connectionConfig,
      ssl: sslConfig,
    },
    searchPath: ['public'],
    pool: {
      // Use defaults conservadores e ajustáveis por ambiente (ajuda em limites de pool, ex: Supabase pgbouncer)
      min: Number.isFinite(poolMin) ? poolMin : (isExternal ? 0 : 0),
      max: Number.isFinite(poolMax) ? poolMax : (isExternal ? 4 : 4),
      idleTimeoutMillis: 5000,
    },
  };

  if (migrations) {
    baseConfig.migrations = migrations;
  }

  if (seeds) {
    baseConfig.seeds = seeds;
  }

  return knex(baseConfig);
};

const primaryDatabaseName = env.DB.NAME;

const primaryConnectionConfig = env.DB.URL
  ? { connectionString: env.DB.URL }
  : sanitizeConnectionConfig({
      host: env.DB.HOST,
      user: env.DB.USER,
      password: env.DB.PASSWORD,
      database: primaryDatabaseName,
      port: parsePort(env.DB.PORT) ?? 5432,
    });

const db = createDbInstance(
  primaryConnectionConfig,
  {
    useSsl: env.DB.SSL,
    migrations: {
      directory: path.join(__dirname, '..', 'database', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '..', 'database', 'seeds'),
    },
  }
);

const externalHost = env.EXTERNAL_DB?.HOST;
let knexExterno = null;

if (externalHost) {
  const externalDatabaseName = env.EXTERNAL_DB?.NAME;

  knexExterno = createDbInstance(
    {
      host: externalHost,
      user: env.EXTERNAL_DB?.USER,
      password: env.EXTERNAL_DB?.PASSWORD,
      database: externalDatabaseName,
      port: parsePort(env.EXTERNAL_DB?.PORT) ?? 5432,
    },
    {
      isExternal: true,
      useSsl: env.EXTERNAL_DB?.SSL ?? false,
    }
  );
} else {
  console.warn(
    '[Database] EXTERNAL_DB_HOST nao configurado. Rotas externas retornarao erro ate que as variaveis sejam definidas.'
  );
}

db.knexExterno = knexExterno;

module.exports = db;
