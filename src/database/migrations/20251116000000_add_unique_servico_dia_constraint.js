// 20251116000000_add_unique_servico_dia_constraint.js

exports.up = async function (knex) {
  // Garante que a coluna exista antes de criar o índice único
  const hasDataInicio = await knex.schema.hasColumn('servico_dia', 'data_inicio');
  const hasData = await knex.schema.hasColumn('servico_dia', 'data');

  if (!hasDataInicio) {
    await knex.raw("ALTER TABLE servico_dia ADD COLUMN IF NOT EXISTS data_inicio timestamptz");
    if (hasData) {
      await knex.raw("UPDATE servico_dia SET data_inicio = data::timestamptz WHERE data IS NOT NULL");
    }
    await knex.raw("UPDATE servico_dia SET data_inicio = NOW() WHERE data_inicio IS NULL");
  }

  return knex.schema.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS uniq_servico ON servico_dia (data_inicio, pessoa_id, pessoa_type, funcao);'
  );
};

exports.down = async function (knex) {
  return knex.schema.raw('DROP INDEX IF EXISTS uniq_servico;');
};
