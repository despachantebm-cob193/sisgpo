// Arquivo: src/database/migrations/202501101113_create_metadata_table.js

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const exists = await knex.schema.hasTable('metadata');
  if (exists) {
    return;
  }

  await knex.schema.createTable('metadata', (table) => {
    table.string('key', 50).primary();
    table.timestamp('value').notNullable();
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('metadata');
};
