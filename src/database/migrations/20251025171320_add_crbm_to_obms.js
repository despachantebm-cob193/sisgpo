// Arquivo: src/database/migrations/XXXXXXXXXXXXXX_add_crbm_to_obms.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('obms', function(table) {
    // Adiciona a coluna crbm, que pode ser nula
    table.string('crbm', 50).nullable().index();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('obms', function(table) {
    table.dropColumn('crbm');
  });
};