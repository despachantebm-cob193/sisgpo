// src/database/migrations/20250903225208_create_metadata_table.js
// Corrigido para ser idempotente (só cria se não existir)

exports.up = async function(knex) {
  const hasMetadataTable = await knex.schema.hasTable('metadata');

  if (!hasMetadataTable) {
    return knex.schema.createTable('metadata', (table) => {
      // Usando a estrutura inferida do erro para garantir a compatibilidade
      table.string('key', 50).primary();
      table.timestamp('value').notNullable();
    });
  }
  // Se a tabela existe, a migração é pulada.
  return Promise.resolve();
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('metadata');
};