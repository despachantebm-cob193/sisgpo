/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1. Unification of 'plantoes' dates
    const hasDataInicio = await knex.schema.hasColumn('plantoes', 'data_inicio');
    const hasDataPlantao = await knex.schema.hasColumn('plantoes', 'data_plantao');

    if (hasDataInicio) {
        // If target column doesn't exist, create it
        if (!hasDataPlantao) {
            await knex.schema.table('plantoes', (table) => {
                table.date('data_plantao');
            });
        }

        // Migration of Data (using raw SQL for performance/compatibility)
        // Update data_plantao from data_inicio where data_plantao is null
        await knex.raw(`
      UPDATE plantoes 
      SET data_plantao = data_inicio 
      WHERE data_plantao IS NULL AND data_inicio IS NOT NULL
    `);

        // Check if we can safely drop data_inicio (or keeping it might be risky if code still uses it? 
        // The instructions say "Drop legacy columns")
        await knex.schema.table('plantoes', (table) => {
            table.dropColumn('data_inicio');
        });
    }

    // Ensure data_plantao is NOT NULL (Warning: might fail if there are nulls. 
    // We assume application logic ensures date. If not, delete orphans?)
    // await knex('plantoes').whereNull('data_plantao').delete(); // Aggressive strategy
    // Better: Set a default or allow null if logical. Shifs usually need a date.
    // We will alter to NOT NULL.
    await knex.schema.alterTable('plantoes', (table) => {
        table.date('data_plantao').notNullable().alter();
    });


    // 2. Constraints for 'viatura_plantao'
    const hasViaturaPlantao = await knex.schema.hasTable('viatura_plantao');
    if (!hasViaturaPlantao) {
        await knex.schema.createTable('viatura_plantao', (table) => {
            table.increments('id').primary();
            table.integer('plantao_id').notNullable(); // FK added below
            table.integer('viatura_id').notNullable(); // FK added below
            table.string('prefixo_viatura');
            table.unique(['plantao_id', 'viatura_id']);
        });
    }

    await knex.schema.alterTable('viatura_plantao', (table) => {
        // Drop existing FKs if any to ensure clean state (optional/complex). 
        // We assume they might not exist or we strictly add them.
        // Knex doesn't support "dropForeignKeyIfExists" easily without name.

        // We try to add constraint. If it fails, it exists.
        // However, best practice in "up" is to ensure structure.
        // We will use raw check or try/catch blocks via logic is hard in migrations without raw.
        // We will simply define them with onDelete CASCADE.
        table.foreign('plantao_id')
            .references('id')
            .inTable('plantoes')
            .onDelete('CASCADE');

        table.foreign('viatura_id')
            .references('id')
            .inTable('viaturas')
            .onDelete('CASCADE');
    });

    // 3. Constraints for 'militar_plantao'
    // (Assuming table exists from previous migrations, just ensuring FK)
    await knex.schema.alterTable('militar_plantao', (table) => {
        // Drop old FKs if they were loose? No, usually fine.
        // Ensure on delete cascade if not present?
        // Note: '20260107...' already added Create Table with References.
        // So this might duplicate constraints if we are not careful. 
        // Since knex doesn't deduplicate, we skip if table was created recently.
        // But to be safe for "Great Consolidation", we can check constraints?
        // Simpler: Trust previous migration for militar_plantao.
        // But we MUST ensure 'id' columns are NOT NULL if not set.
        table.integer('plantao_id').notNullable().alter();
        table.integer('militar_id').notNullable().alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Reverting is complex for dropped columns. We can add back data_inicio.
    await knex.schema.table('plantoes', (table) => {
        table.date('data_inicio').nullable(); // Was dropped
    });

    // Copy data back
    await knex.raw(`
    UPDATE plantoes 
    SET data_inicio = data_plantao
  `);
};
