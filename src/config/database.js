// src/config/database.js
const knex = require('knex');
const knexfile = require('../../knexfile'); // Importa as configurações do knexfile

// Determina o ambiente. Padrão para 'development' se não estiver definido.
const environment = process.env.NODE_ENV || 'development';

console.log(`[Database] Conectando ao banco de dados do ambiente: ${environment.toUpperCase()}`);

// Seleciona a configuração correta do knexfile com base no ambiente
const config = knexfile[environment];

// Verifica se a configuração para o ambiente foi encontrada
if (!config) {
  throw new Error(`Configuração de banco de dados para o ambiente "${environment}" não encontrada no knexfile.js`);
}

// Cria e exporta a instância do Knex
const db = knex(config);

// Testa a conexão para dar um feedback no console
db.raw('SELECT 1+1 AS result').then(() => {
  console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
}).catch(err => {
  console.error('❌ Erro ao conectar com o banco de dados:', err);
  process.exit(1); // Encerra a aplicação se não conseguir conectar
});

module.exports = db;
