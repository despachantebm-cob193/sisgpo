// Arquivo: backend/src/database/migrations/<timestamp>_add_telefone_to_militares.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('militares', function(table) {
    // Adiciona a nova coluna 'telefone' que pode ser nula
    table.string('telefone', 20).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('militares', function(table) {
    // Remove a coluna 'telefone' caso precise reverter a migration
    table.dropColumn('telefone');
  });
};
