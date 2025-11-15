// 20251115220000_add_unique_plantao_data_viatura.js

exports.up = async function(knex) {
  return knex.schema.table('plantoes', (table) => {
    table.unique(['data_plantao', 'viatura_id'], 'uniq_plantoes_data_viatura');
  });
};

exports.down = async function(knex) {
  return knex.schema.table('plantoes', (table) => {
    table.dropUnique(['data_plantao', 'viatura_id'], 'uniq_plantoes_data_viatura');
  });
};
