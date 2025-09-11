// Arquivo: backend/src/database/migrations/20251109075900_refactor_civis_to_medicos.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Altera a tabela 'civis' para funcionar como um cadastro de médicos
  return knex.schema.alterTable('civis', function (table) {
    // Remove colunas relacionadas à escala de serviço
    table.dropColumn('entrada_servico');
    table.dropColumn('saida_servico');
    table.dropColumn('status_servico');
    
    // Adiciona a coluna de telefone, que estava faltando
    table.string('telefone', 20).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Reverte as alterações, adicionando as colunas de volta
  return knex.schema.alterTable('civis', function (table) {
    table.timestamp('entrada_servico').nullable();
    table.timestamp('saida_servico').nullable();
    table.string('status_servico', 20).defaultTo('Presente').notNullable();
    table.dropColumn('telefone');
  });
};
