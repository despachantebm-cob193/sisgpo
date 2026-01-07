import knex, { Knex } from 'knex';
import path from 'path';
import env from './env';

type DatabaseInstance = Knex & { knexExterno?: Knex | null };

const parseBoolean = (value: string | boolean | undefined, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalized);
};

const parsePort = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return undefined;
  const port = Number(value);
  return Number.isFinite(port) ? port : undefined;
};

const sanitizeConnectionConfig = (config: Record<string, unknown>) => {
  return Object.entries(config).reduce<Record<string, unknown>>((result, [key, entryValue]) => {
    if (entryValue === undefined || entryValue === null || entryValue === '') {
      return result;
    }
    result[key] = entryValue;
    return result;
  }, {});
};

const createDbInstance = (
  connectionConfig: Knex.StaticConnectionConfig | Knex.ConnectionConfig,
  options: {
    isExternal?: boolean;
    useSsl?: boolean;
    migrations?: Knex.MigratorConfig;
    seeds?: Knex.SeederConfig;
  } = {},
): Knex => {
  const { isExternal = false, useSsl = false, migrations, seeds } = options;

  const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

  const poolMin = parseInt(process.env.DB_POOL_MIN || '', 10);
  const poolMax = parseInt(process.env.DB_POOL_MAX || '', 10);

  const baseConfig: Knex.Config = {
    client: 'pg',
    connection: {
      ...connectionConfig,
      ssl: sslConfig,
    },
    searchPath: ['public'],
    pool: {
      min: Number.isFinite(poolMin) ? poolMin : isExternal ? 0 : 0,
      max: Number.isFinite(poolMax) ? poolMax : isExternal ? 4 : 4,
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

const db = createDbInstance(primaryConnectionConfig, {
  useSsl: env.DB.SSL,
  migrations: {
    directory: path.join(__dirname, '..', 'database', 'migrations'),
  },
  seeds: {
    directory: path.join(__dirname, '..', 'database', 'seeds'),
  },
}) as DatabaseInstance;

const externalHost = env.EXTERNAL_DB?.HOST;

if (externalHost) {
  const externalDatabaseName = env.EXTERNAL_DB?.NAME;

  db.knexExterno = createDbInstance(
    {
      host: externalHost,
      user: env.EXTERNAL_DB?.USER,
      password: env.EXTERNAL_DB?.PASSWORD,
      database: externalDatabaseName,
      port: parsePort(env.EXTERNAL_DB?.PORT) ?? 5432,
    },
    {
      isExternal: true,
      useSsl: parseBoolean(env.EXTERNAL_DB?.SSL ?? false),
    },
  );
} else {
  console.warn(
    '[Database] EXTERNAL_DB_HOST nao configurado. Rotas externas retornarao erro ate que as variaveis sejam definidas.',
  );
  db.knexExterno = null;
}

export = db;
