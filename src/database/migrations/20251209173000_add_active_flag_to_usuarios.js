// Arquivo: src/database/migrations/20251209173000_add_active_flag_to_usuarios.js

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('usuarios', 'ativo');
  if (hasColumn) {
    return;
  }

  await knex.schema.alterTable('usuarios', (table) => {
    table.boolean('ativo').notNullable().defaultTo(true);
  });

  await knex('usuarios').update({ ativo: true });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('usuarios', 'ativo');
  if (!hasColumn) {
    return;
  }

  await knex.schema.alterTable('usuarios', (table) => {
    table.dropColumn('ativo');
  });
};
