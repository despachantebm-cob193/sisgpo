// src/config/database.js

require('dotenv').config();
const knex = require('knex');
const path = require('path'); // NOVO: Importa o módulo path para resolver caminhos

// Função para checar se o ambiente requer SSL (Neon.tech/Vercel)
const isCloudEnv = process.env.NODE_ENV === 'production' || 
                   process.env.DB_HOST?.includes('neon.tech') || 
                   process.env.EXTERNAL_DB_HOST?.includes('neon.tech');

// Modifica a função para aceitar configurações extras como migrations
const createDbInstance = (connectionConfig, isExternal = false, extraConfig = {}) => knex({
  client: 'pg',
  connection: {
    ...connectionConfig,
    ssl: isCloudEnv || isExternal ? { rejectUnauthorized: false } : false,
  },
  searchPath: ['public'],
  pool: {
    min: isExternal ? 0 : 2,
    max: isExternal ? 5 : 10,
    idleTimeoutMillis: 5000, 
  },
  ...extraConfig, // Adiciona configurações extras (como migrations)
});


// --- Configuração Principal e Externa ---

// 1. Configuração do Banco de Dados Principal (SISGPO) - COM CAMINHOS DE MIGRAÇÃO
const db = createDbInstance({ 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
}, false, { // Passa a configuração de migrações aqui
    migrations: {
        // Caminho correto: sobe um nível (..) de /config e entra em /database/migrations
        directory: path.join(__dirname, '..', 'database', 'migrations'), 
    },
    seeds: {
        directory: path.join(__dirname, '..', 'database', 'seeds'),
    }
});

// 2. Configuração do Banco de Dados Externo (Dashboard Espelho)
const knexExterno = createDbInstance({
    host: process.env.EXTERNAL_DB_HOST,
    user: process.env.EXTERNAL_DB_USER,
    password: process.env.EXTERNAL_DB_PASSWORD,
    database: process.env.EXTERNAL_DB_NAME,
}, true);

db.knexExterno = knexExterno;

// Exporta o Knex principal.
module.exports = db;