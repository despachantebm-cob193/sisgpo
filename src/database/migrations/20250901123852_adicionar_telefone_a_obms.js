// Arquivo: src/database/migrations/20250901191649_adicionar_telefone_a_obms.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // A coluna 'telefone' já existe no banco de dados.
  // Retornamos uma promessa resolvida para que o Knex apenas marque esta migração como concluída.
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' deve ser capaz de reverter a alteração.
  return knex.schema.alterTable('obms', function(table) {
    table.dropColumn('telefone');
  });
};
