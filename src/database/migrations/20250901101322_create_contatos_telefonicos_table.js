/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('contatos_telefonicos', function (table) {
    table.increments('id').primary();
    table.string('orgao', 255).notNullable();
    table.string('obm_local', 255);
    table.string('secao_departamento', 255).notNullable();
    table.string('telefone', 100).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('contatos_telefonicos');
};
