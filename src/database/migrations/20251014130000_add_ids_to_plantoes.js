// src/database/migrations/20251014130000_add_ids_to_plantoes.js

exports.up = async function (knex) {
  const hasPlantoesTable = await knex.schema.hasTable('plantoes');
  if (!hasPlantoesTable) {
    return;
  }

  const hasViaturaId = await knex.schema.hasColumn('plantoes', 'viatura_id');
  const hasObmId = await knex.schema.hasColumn('plantoes', 'obm_id');

  if (!hasViaturaId || !hasObmId) {
    await knex.schema.table('plantoes', (table) => {
      if (!hasViaturaId) {
        table
          .integer('viatura_id')
          .unsigned()
          .references('id')
          .inTable('viaturas')
          .onDelete('SET NULL');
      }

      if (!hasObmId) {
        table
          .integer('obm_id')
          .unsigned()
          .references('id')
          .inTable('obms')
          .onDelete('SET NULL');
      }
    });
  }
};

exports.down = async function (knex) {
  const hasPlantoesTable = await knex.schema.hasTable('plantoes');
  if (!hasPlantoesTable) {
    return;
  }

  const hasViaturaId = await knex.schema.hasColumn('plantoes', 'viatura_id');
  const hasObmId = await knex.schema.hasColumn('plantoes', 'obm_id');

  if (hasViaturaId || hasObmId) {
    await knex.schema.table('plantoes', (table) => {
      if (hasViaturaId) {
        table.dropColumn('viatura_id');
      }

      if (hasObmId) {
        table.dropColumn('obm_id');
      }
    });
  }
};
