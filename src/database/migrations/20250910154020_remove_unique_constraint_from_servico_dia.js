// Arquivo: backend/src/database/migrations/<timestamp>_remove_unique_constraint_from_servico_dia.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('servico_dia', function(table) {
    // Remove a restrição UNIQUE da combinação de 'data' e 'funcao'
    table.dropUnique(['data', 'funcao']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Função para recriar a restrição caso precise reverter
  return knex.schema.alterTable('servico_dia', function(table) {
    table.unique(['data', 'funcao']);
  });
};
