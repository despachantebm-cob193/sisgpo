// 20251116010000_add_unique_civis_base_medico_index.js

exports.up = async function(knex) {
  // Adiciona um índice único parcial para garantir uma base civil única por médico com janela aberta
  return knex.schema.raw('CREATE UNIQUE INDEX uniq_civis_base_medico ON civis (medico_id) WHERE entrada_servico IS NULL AND saida_servico IS NULL;');
};

exports.down = async function(knex) {
  // Remove o índice único parcial
  return knex.schema.raw('DROP INDEX uniq_civis_base_medico;');
};
