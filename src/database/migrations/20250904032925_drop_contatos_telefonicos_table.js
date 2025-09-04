// Arquivo: backend/src/database/migrations/...(seu_timestamp)_drop_contatos_telefonicos_table.js (Novo)

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // A função 'up' remove a tabela do banco de dados.
  return knex.schema.dropTableIfExists('contatos_telefonicos');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' recria a tabela, permitindo reverter a exclusão se necessário.
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
