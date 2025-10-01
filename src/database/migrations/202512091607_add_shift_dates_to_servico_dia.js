// Arquivo: backend/src/database/migrations/202512091607_add_shift_dates_to_servico_dia.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasDataColumn = await knex.schema.hasColumn('servico_dia', 'data');

  await knex.schema.alterTable('servico_dia', (table) => {
    table.timestamp('data_inicio', { useTz: true });
    table.timestamp('data_fim', { useTz: true });
  });

  if (hasDataColumn) {
    await knex('servico_dia').update({
      data_inicio: knex.raw('"data"::timestamptz'),
      data_fim: knex.raw('("data"::timestamptz + interval ''1 day'')'),
    });
  }

  await knex('servico_dia')
    .whereNull('data_inicio')
    .update({
      data_inicio: knex.fn.now(),
      data_fim: knex.raw('NOW() + interval ''1 day'''),
    });

  await knex.raw(`
    ALTER TABLE servico_dia
      ALTER COLUMN data_inicio SET NOT NULL,
      ALTER COLUMN data_fim SET NOT NULL
  `);

  if (hasDataColumn) {
    await knex.raw('DROP INDEX IF EXISTS idx_servico_dia_data');
    await knex.schema.alterTable('servico_dia', (table) => {
      table.dropColumn('data');
    });
  }

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_servico_dia_data_inicio ON servico_dia (data_inicio)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_servico_dia_data_inicio');

  const hasDataColumn = await knex.schema.hasColumn('servico_dia', 'data');
  if (!hasDataColumn) {
    await knex.schema.alterTable('servico_dia', (table) => {
      table.date('data');
    });

    await knex('servico_dia').update({
      data: knex.raw('data_inicio::date'),
    });

    await knex.raw('ALTER TABLE servico_dia ALTER COLUMN data SET NOT NULL');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_servico_dia_data ON servico_dia (data)');
  }

  const hasDataInicio = await knex.schema.hasColumn('servico_dia', 'data_inicio');
  const hasDataFim = await knex.schema.hasColumn('servico_dia', 'data_fim');

  if (hasDataInicio || hasDataFim) {
    await knex.schema.alterTable('servico_dia', (table) => {
      if (hasDataInicio) {
        table.dropColumn('data_inicio');
      }
      if (hasDataFim) {
        table.dropColumn('data_fim');
      }
    });
  }
};
