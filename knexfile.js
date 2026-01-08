// Arquivo: knexfile.js (Simplified to match runtime env loading)

const fs = require('fs');
const path = require('path');

// Load .env file (same as runtime)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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
    connection: process.env.DATABASE_URL || getLocalConnection(),
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
