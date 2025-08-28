const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuração de conexão para produção
const productionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

// Configuração de conexão para desenvolvimento
const developmentConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Escolhe a configuração com base no ambiente
const connectionConfig = isProduction ? productionConfig : developmentConfig;

console.log(`[Database] Conectando ao banco de dados do ambiente: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

const pool = new Pool(connectionConfig);

// Testa a conexão
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar com o banco de dados:', err.stack);
  }
  console.log(`✅ Conexão com o banco de dados estabelecida com sucesso!`);
  client.release();
});

module.exports = pool;
