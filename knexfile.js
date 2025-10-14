// Arquivo: knexfile.js (Corrigido para carregar o .env correto e desativar SSL)

const path = require('path');

// Carrega as variáveis de ambiente corretas com base no NODE_ENV
// Se for 'test', carrega .env.test. Caso contrário, carrega .env.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // CORREÇÃO CRÍTICA: Desativa SSL para conexões PostgreSQL locais
      ssl: false,
    },
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
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // CORREÇÃO: Desativa SSL para conexões de teste locais
      ssl: false,
    },
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