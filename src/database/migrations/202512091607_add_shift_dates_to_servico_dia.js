// Arquivo: backend/src/database/migrations/<timestamp>_add_shift_dates_to_servico_dia.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('servico_dia', function(table) {
    // Remove a coluna de data única
    table.dropColumn('data');
    
    // Adiciona as colunas de início e fim do plantão
    table.timestamp('data_inicio').notNullable();
    table.timestamp('data_fim').notNullable();

    // Adiciona um índice para otimizar buscas por data de início
    table.index('data_inicio');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('servico_dia', function(table) {
    // Reverte as alterações
    table.dropColumn('data_inicio');
    table.dropColumn('data_fim');
    table.date('data').notNullable();
    table.dropIndex('data_inicio');
  });
};
