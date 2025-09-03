/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('obms', function(table) {
    // Adiciona a coluna 'telefone', permitindo que seja nula
    table.string('telefone', 20).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' remove a coluna
  return knex.schema.alterTable('obms', function(table) {
    table.dropColumn('telefone');
  });
};
