// src/config/database.js

require('dotenv').config();
const knex = require('knex');
const path = require('path');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalized);
};

const isCloudPrimary =
  process.env.NODE_ENV === 'production' ||
  (process.env.DB_HOST || '').includes('neon.tech');

const createDbInstance = (connectionConfig, options = {}) => {
  const {
    isExternal = false,
    useSsl = false,
    migrations,
    seeds,
  } = options;

  const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

  const baseConfig = {
    client: 'pg',
    connection: {
      ...connectionConfig,
      ssl: sslConfig,
    },
    searchPath: ['public'],
    pool: {
      min: isExternal ? 0 : 2,
      max: isExternal ? 5 : 10,
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

const primaryDatabaseName = process.env.DB_DATABASE || process.env.DB_NAME;

const db = createDbInstance(
  {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: primaryDatabaseName,
    port: Number(process.env.DB_PORT) || 5432,
  },
  {
    useSsl: parseBoolean(process.env.DB_SSL, isCloudPrimary),
    migrations: {
      directory: path.join(__dirname, '..', 'database', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '..', 'database', 'seeds'),
    },
  }
);

const externalHost = process.env.EXTERNAL_DB_HOST;
let knexExterno = null;

if (externalHost) {
  const externalDatabaseName =
    process.env.EXTERNAL_DB_NAME || process.env.EXTERNAL_DB_DATABASE;

  const externalRequiresSsl =
    parseBoolean(
      process.env.EXTERNAL_DB_SSL,
      (externalHost || '').includes('neon.tech')
    );

  knexExterno = createDbInstance(
    {
      host: externalHost,
      user: process.env.EXTERNAL_DB_USER,
      password: process.env.EXTERNAL_DB_PASSWORD,
      database: externalDatabaseName,
      port: Number(process.env.EXTERNAL_DB_PORT) || 5432,
    },
    {
      isExternal: true,
      useSsl: externalRequiresSsl,
    }
  );
} else {
  console.warn(
    '[Database] EXTERNAL_DB_HOST nao configurado. Rotas externas retornarao erro ate que as variaveis sejam definidas.'
  );
}

db.knexExterno = knexExterno;

module.exports = db;
