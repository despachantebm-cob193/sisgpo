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
    // Chave estrangeira para a tabela 'militares'
    table.integer('militar_id').unsigned().references('id').inTable('militares').onDelete('SET NULL');
    
    // Timestamps automáticos
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Garante que só pode haver uma função por data (ex: apenas um "Superior de Dia" por data)
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