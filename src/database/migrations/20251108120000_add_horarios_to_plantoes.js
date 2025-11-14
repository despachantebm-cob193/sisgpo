// src/database/migrations/20251108120000_add_horarios_to_plantoes.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasHoraInicio = await knex.schema.hasColumn('plantoes', 'hora_inicio');
  const hasHoraFim = await knex.schema.hasColumn('plantoes', 'hora_fim');

  if (hasHoraInicio && hasHoraFim) {
    return;
  }

  await knex.schema.alterTable('plantoes', (table) => {
    if (!hasHoraInicio) {
      table.time('hora_inicio').nullable();
    }
    if (!hasHoraFim) {
      table.time('hora_fim').nullable();
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  const hasHoraInicio = await knex.schema.hasColumn('plantoes', 'hora_inicio');
  const hasHoraFim = await knex.schema.hasColumn('plantoes', 'hora_fim');

  if (!hasHoraInicio && !hasHoraFim) {
    return;
  }

  await knex.schema.alterTable('plantoes', (table) => {
    if (hasHoraInicio) {
      table.dropColumn('hora_inicio');
    }
    if (hasHoraFim) {
      table.dropColumn('hora_fim');
    }
  });
};
