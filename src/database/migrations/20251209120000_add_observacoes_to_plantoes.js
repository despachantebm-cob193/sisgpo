// 20251209120000_add_observacoes_to_plantoes.js

/**
 * Garantimos que a tabela plantoes possua a coluna observacoes usada pelo
 * sistema-ocorrencias ao lançar plantões. Usamos checagens defensivas para
 * não falhar em bancos já alinhados.
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('plantoes');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('plantoes', 'observacoes');
  if (hasColumn) return;

  await knex.schema.alterTable('plantoes', (table) => {
    table.text('observacoes').nullable();
  });
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('plantoes');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('plantoes', 'observacoes');
  if (!hasColumn) return;

  await knex.schema.alterTable('plantoes', (table) => {
    table.dropColumn('observacoes');
  });
};
