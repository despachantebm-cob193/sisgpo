/**
 * Cria a tabela 'medicos' utilizada pelo cadastro de médicos no painel administrativo.
 *
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function up(knex) {
  const exists = await knex.schema.hasTable('medicos');
  if (exists) {
    return;
  }

  await knex.schema.createTable('medicos', (table) => {
    table.increments('id').primary();
    table.string('nome_completo', 150).notNullable();
    table.string('funcao', 100).notNullable();
    table.string('telefone', 20).nullable();
    table.text('observacoes').nullable();
    table.boolean('ativo').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * Remove a tabela 'medicos'.
 *
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function down(knex) {
  const exists = await knex.schema.hasTable('medicos');
  if (!exists) {
    return;
  }

  await knex.schema.dropTable('medicos');
};

