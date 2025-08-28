// Carrega as variáveis de ambiente do arquivo .env para os ambientes de desenvolvimento e teste
require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    migrations: {
      directory: './src/database/migrations'
    }
  },

  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST_TEST,
      port: process.env.DB_PORT_TEST,
      user: process.env.DB_USER_TEST,
      password: process.env.DB_PASSWORD_TEST,
      database: process.env.DB_DATABASE_TEST,
    },
    migrations: {
      directory: './src/database/migrations'
    }
  },

  // --- SEÇÃO DE PRODUÇÃO MODIFICADA ---
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Necessário para conexões SSL no Render
    },
    migrations: {
      directory: './src/database/migrations'
    }
  }
  // ------------------------------------
};
