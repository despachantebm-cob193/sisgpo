/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1. Create Dashboard Cache Table
    await knex.schema.createTable('dashboard_cache', (table) => {
        table.string('key').primary();
        table.jsonb('data').notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 2. Add Composite Indexes for Performance
    // plantoes(data_plantao, obm_id) - Optimizes filtering by date and obm
    await knex.schema.alterTable('plantoes', (table) => {
        table.index(['data_plantao', 'obm_id'], 'idx_plantoes_data_obm');
        table.index(['data_plantao', 'viatura_id'], 'idx_plantoes_data_viatura');
    });

    // viaturas(ativa) - Frequent filter
    // Usually partial index "where ativa = true" is better but Knex generic support varies.
    // We'll create a simple index.
    await knex.schema.alterTable('viaturas', (table) => {
        table.index(['ativa', 'prefixo'], 'idx_viaturas_ativa_prefixo');
    });

    // Add keys to optimize joins if not present
    // militar_plantao(militar_id, plantao_id) is unique, so indexed.
    // viatura_plantao(viatura_id, plantao_id) is unique, so indexed.
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('dashboard_cache');

    await knex.schema.alterTable('plantoes', (table) => {
        table.dropIndex(['data_plantao', 'obm_id'], 'idx_plantoes_data_obm');
        table.dropIndex(['data_plantao', 'viatura_id'], 'idx_plantoes_data_viatura');
    });

    await knex.schema.alterTable('viaturas', (table) => {
        table.dropIndex(['ativa', 'prefixo'], 'idx_viaturas_ativa_prefixo');
    });
};
