// src/config/database.js
const knex = require('knex');
const knexConfig = require('../../knexfile'); // Caminho para o knexfile na raiz do projeto

// Determina o ambiente. O Render define NODE_ENV='production' automaticamente.
const env = process.env.NODE_ENV || 'development';

// Seleciona a configuração correta do knexfile.js
const config = knexConfig[env];

console.log(`[Database] Inicializando Knex para o ambiente: ${env.toUpperCase()}`);

// Cria e exporta a instância do Knex com a configuração correta
const db = knex(config);

// Testa a conexão para dar um feedback no log
db.raw('SELECT 1+1 AS result')
  .then(() => {
    // Em produção, não exponha detalhes do banco.
    if (env === 'production') {
      console.log('✅ Conexão com o banco de dados de produção estabelecida com sucesso!');
    } else {
      console.log(`✅ Conexão com o banco de dados (${db.client.config.connection.database}) estabelecida com sucesso!`);
    }
  })
  .catch((err) => {
    console.error('!!!!!!!!!! FALHA CRÍTICA AO CONECTAR COM O BANCO DE DADOS !!!!!!!!!!');
    console.error(err.message);
    // Em um cenário real, você poderia querer que a aplicação parasse se não puder conectar.
    // process.exit(1); 
  });

module.exports = db;
