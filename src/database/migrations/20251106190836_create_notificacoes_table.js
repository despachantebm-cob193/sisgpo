/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notificacoes', function(table) {
    table.increments('id');
    table.string('mensagem').notNullable();
    table.boolean('lida').defaultTo(false);
    table.timestamps(true, true);
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('notificacoes');
};