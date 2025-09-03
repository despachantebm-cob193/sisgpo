// Arquivo: src/database/migrations/20250901101322_create_contatos_telefonicos_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Como a tabela já existe, não faremos nada aqui.
  // Apenas retornamos uma promessa resolvida para o Knex marcar esta migração como concluída.
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' deve ser capaz de apagar a tabela, caso seja necessário reverter.
  return knex.schema.dropTableIfExists('contatos_telefonicos');
};
