// 20251115210000_add_unique_case_insensitive_obm_abreviatura.js

exports.up = async function(knex) {
  // Adiciona um índice único funcional para garantir abreviaturas case-insensitive únicas
  return knex.schema.raw('CREATE UNIQUE INDEX obms_abreviatura_upper_unique ON obms (UPPER(abreviatura));');
};

exports.down = async function(knex) {
  // Remove o índice único funcional
  return knex.schema.raw('DROP INDEX obms_abreviatura_upper_unique;');
};
