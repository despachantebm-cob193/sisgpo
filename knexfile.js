// Arquivo: knexfile.js (Corrigido para carregar o .env correto e desativar SSL)

const fs = require('fs');
const path = require('path');

const nodeEnv = process.env.NODE_ENV || 'development';
const envFileName = nodeEnv === 'production' ? '.env' : `.env.${nodeEnv}`;
const envFilePath = path.resolve(__dirname, envFileName);
const fallbackEnvPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envFilePath)) {
  require('dotenv').config({ path: envFilePath });
} else {
  require('dotenv').config({ path: fallbackEnvPath });
}

const getLocalConnection = () => ({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: false,
});

module.exports = {
  development: {
    client: 'pg',
    connection: getLocalConnection(),
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },

  // --- SEÇÃO DE TESTE CORRIGIDA E COMPLETA ---
  test: {
    client: 'pg', 
    connection: getLocalConnection(),
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },
  // -----------------------------------------

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      // A produção geralmente requer SSL ativo
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
