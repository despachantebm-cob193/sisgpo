// 20251115230000_add_unique_escala_codec_constraint.js

exports.up = async function(knex) {
  return knex.schema.table('escala_codec', (table) => {
    table.unique(['data', 'turno', 'militar_id'], 'uniq_codec_data_turno_militar');
  });
};

exports.down = async function(knex) {
  return knex.schema.table('escala_codec', (table) => {
    table.dropUnique(['data', 'turno', 'militar_id'], 'uniq_codec_data_turno_militar');
  });
};
