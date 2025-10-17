const knex = require('knex');
const configuration = require('../../knexfile');

// Usa a configuração de 'development' do knexfile.js
const connection = knex(configuration.development);

module.exports = connection;