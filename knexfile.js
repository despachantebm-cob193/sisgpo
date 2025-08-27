// Carrega as variáveis de ambiente do arquivo .env
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
      directory: './src/database/migrations' // Ajuste o caminho se necessário
    }
  },

  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST_TEST || 'localhost',
      port: process.env.DB_PORT_TEST || '5433', // Use uma porta ou DB diferente para testes
      user: process.env.DB_USER_TEST || 'postgres',
      password: process.env.DB_PASSWORD_TEST || 'docker',
      database: process.env.DB_DATABASE_TEST || 'sisgpo_test',
    },
    migrations: {
      directory: './src/database/migrations' // O mesmo caminho das migrations
    }
  }
};
