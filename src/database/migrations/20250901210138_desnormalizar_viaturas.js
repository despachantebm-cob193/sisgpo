// Arquivo: src/database/migrations/20250901210138_desnormalizar_viaturas.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // As colunas já existem no banco de dados.
  // Retornamos uma promessa resolvida para que o Knex apenas marque esta migração como concluída.
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' deve ser capaz de reverter as alterações.
  return knex.schema.alterTable('viaturas', function(table) {
    table.dropColumn('cidade');
    table.dropColumn('obm');
    table.dropColumn('telefone');
    
    // Recria a coluna de chave estrangeira original
    table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
  });
};
