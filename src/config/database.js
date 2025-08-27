const { Pool } = require('pg');
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

// Define as configurações de conexão para cada ambiente
const connectionConfigs = {
  development: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  test: {
    host: process.env.DB_HOST_TEST,
    port: process.env.DB_PORT_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_DATABASE_TEST,
  }
};

// Escolhe a configuração com base no ambiente atual (NODE_ENV)
// O Jest define automaticamente NODE_ENV='test'
const env = process.env.NODE_ENV || 'development';
const connectionConfig = connectionConfigs[env];

console.log(`[Database] Conectando ao banco de dados do ambiente: ${env.toUpperCase()}`);

// Cria o pool de conexões com a configuração correta
const pool = new Pool(connectionConfig);

// Testa a conexão apenas se não estiver em ambiente de teste para evitar logs desnecessários
if (env !== 'test') {
  pool.connect((err, client, release) => {
    if (err) {
      return console.error('Erro ao conectar com o banco de dados:', err.stack);
    }
    console.log(`✅ Conexão com o banco de dados (${connectionConfig.database}) estabelecida com sucesso!`);
    client.release();
  });
}

module.exports = pool;
