// Arquivo: backend/src/database/migrations/202512091607_add_shift_dates_to_servico_dia.js

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasDataColumn = await knex.schema.hasColumn('servico_dia', 'data');

  await knex.raw("ALTER TABLE servico_dia ADD COLUMN IF NOT EXISTS data_inicio timestamptz");
  await knex.raw("ALTER TABLE servico_dia ADD COLUMN IF NOT EXISTS data_fim timestamptz");

  if (hasDataColumn) {
    await knex.raw("UPDATE servico_dia SET data_inicio = data::timestamptz, data_fim = data::timestamptz + INTERVAL '1 day' WHERE data IS NOT NULL");
  }

  await knex.raw("UPDATE servico_dia SET data_inicio = NOW(), data_fim = NOW() + INTERVAL '1 day' WHERE data_inicio IS NULL");

  await knex.raw("ALTER TABLE servico_dia ALTER COLUMN data_inicio SET NOT NULL");
  await knex.raw("ALTER TABLE servico_dia ALTER COLUMN data_fim SET NOT NULL");

  if (hasDataColumn) {
    await knex.raw('DROP INDEX IF EXISTS idx_servico_dia_data');
    await knex.raw('ALTER TABLE servico_dia DROP COLUMN IF EXISTS data');
  }

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_servico_dia_data_inicio ON servico_dia (data_inicio)');
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_servico_dia_data_inicio');

  const hasDataColumn = await knex.schema.hasColumn('servico_dia', 'data');
  if (!hasDataColumn) {
    await knex.raw('ALTER TABLE servico_dia ADD COLUMN data date');
    await knex.raw('UPDATE servico_dia SET data = data_inicio::date WHERE data IS NULL');
    await knex.raw('ALTER TABLE servico_dia ALTER COLUMN data SET NOT NULL');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_servico_dia_data ON servico_dia (data)');
  }

  const hasDataInicio = await knex.schema.hasColumn('servico_dia', 'data_inicio');
  const hasDataFim = await knex.schema.hasColumn('servico_dia', 'data_fim');

  if (hasDataInicio) {
    await knex.raw('ALTER TABLE servico_dia DROP COLUMN IF EXISTS data_inicio');
  }
  if (hasDataFim) {
    await knex.raw('ALTER TABLE servico_dia DROP COLUMN IF EXISTS data_fim');
  }
};
