/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('usuarios', function(table) {
    table.string('status').defaultTo('pending');
    table.string('perfil_desejado');
    table.integer('aprovado_por').references('id').inTable('usuarios');
    table.timestamp('aprovado_em');
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('usuarios', function(table) {
    table.dropColumn('status');
    table.dropColumn('perfil_desejado');
    table.dropColumn('aprovado_por');
    table.dropColumn('aprovado_em');
  });
};