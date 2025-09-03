// Arquivo: src/database/migrations/20250901181445_remove_fields_from_viaturas.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // As colunas já foram removidas do banco de dados.
  // Retornamos uma promessa resolvida para que o Knex apenas marque esta migração como concluída.
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' deve ser capaz de recriar as colunas caso seja necessário reverter.
  return knex.schema.alterTable('viaturas', function(table) {
    table.string('placa', 10);
    table.string('modelo', 100);
    table.integer('ano');
    table.string('tipo', 50);
  });
};
