// src/database/migrations/XXXXXXXX_increase_abreviatura_length.js

exports.up = function(knex) {
  // Altera o tamanho da coluna 'abreviatura' para 50 caracteres
  return knex.schema.table('obms', (table) => {
    // .alter() modifica a coluna
    table.string('abreviatura', 50).alter(); 
  });
};

exports.down = function(knex) {
  // Reverte a alteração (opcional, mas boa prática)
  return knex.schema.table('obms', (table) => {
    table.string('abreviatura', 10).alter();
  });
};