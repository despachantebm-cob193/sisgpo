// src/database/migrations/20251014130000_add_ids_to_plantoes.js

exports.up = async function(knex) {
  const hasPlantoesTable = await knex.schema.hasTable('plantoes');
  if (hasPlantoesTable) {
    await knex.schema.table('plantoes', (table) => {
      table.integer('viatura_id').unsigned().references('id').inTable('viaturas').onDelete('SET NULL');
      table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('plantoes', (table) => {
    table.dropColumn('viatura_id');
    table.dropColumn('obm_id');
  });
};