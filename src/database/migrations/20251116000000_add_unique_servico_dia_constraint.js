// 20251116000000_add_unique_servico_dia_constraint.js

exports.up = async function(knex) {
  return knex.schema.raw('CREATE UNIQUE INDEX uniq_servico ON servico_dia (data_inicio, pessoa_id, pessoa_type, funcao);');
};

exports.down = async function(knex) {
  return knex.schema.raw('DROP INDEX uniq_servico;');
};
