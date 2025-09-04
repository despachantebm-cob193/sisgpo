// Arquivo: backend/src/database/migrations/<timestamp>_create_servico_dia_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('servico_dia', function(table) {
    table.increments('id').primary();
    table.date('data').notNullable();
    table.string('funcao', 100).notNullable();
    table.integer('militar_id').unsigned().references('id').inTable('militares').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Garante que só pode haver um militar por função em uma data específica
    table.unique(['data', 'funcao']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('servico_dia');
};
