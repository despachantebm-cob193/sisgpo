// Arquivo: backend/src/database/migrations/<timestamp>_refactor_servico_dia_polymorphic.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('servico_dia', function(table) {
    // 1. Remove a chave estrangeira e a coluna antiga
    table.dropForeign('militar_id');
    table.dropColumn('militar_id');

    // 2. Adiciona as novas colunas para a relação polimórfica
    table.integer('pessoa_id').unsigned(); // Armazena o ID da pessoa
    table.string('pessoa_type', 50); // Armazena o tipo ('militar' ou 'civil')
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Função para reverter as alterações, caso necessário
  return knex.schema.alterTable('servico_dia', function(table) {
    table.dropColumn('pessoa_id');
    table.dropColumn('pessoa_type');

    // Recria a coluna e a chave estrangeira originais
    table.integer('militar_id').unsigned().references('id').inTable('militares').onDelete('SET NULL');
  });
};
