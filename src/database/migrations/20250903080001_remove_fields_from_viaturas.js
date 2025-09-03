// backend/src/database/migrations/20250903080001_remove_fields_from_viaturas.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('viaturas', function(table) {
    table.dropColumn('placa');
    table.dropColumn('modelo');
    table.dropColumn('ano');
    table.dropColumn('tipo');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('viaturas', function(table) {
    table.string('placa', 10);
    table.string('modelo', 100);
    table.integer('ano');
    table.string('tipo', 50);
  });
};
