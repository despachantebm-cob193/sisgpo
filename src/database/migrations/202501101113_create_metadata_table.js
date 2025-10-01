// Arquivo: src/database/migrations/<timestamp>_create_metadata_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('metadata', function(table) {
    table.string('key', 50).primary(); // A chave, ex: 'viaturas_last_upload'
    table.timestamp('value').notNullable(); // O valor, que será nossa data
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('metadata');
};
