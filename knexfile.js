// knexfile.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

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
    },
    seeds: { // <-- ADICIONAR ESTA SEÇÃO
      directory: './src/database/seeds'
    }
  },

  test: {
    // ... configuração de teste
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: { // <-- ADICIONAR ESTA SEÇÃO
      directory: './src/database/seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: { // <-- ADICIONAR ESTA SEÇÃO
      directory: './src/database/seeds'
    }
  }
};
