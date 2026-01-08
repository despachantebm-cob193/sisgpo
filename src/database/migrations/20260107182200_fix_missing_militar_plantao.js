
exports.up = async function (knex) {
    const hasTable = await knex.schema.hasTable('militar_plantao');

    if (!hasTable) {
        await knex.schema.createTable('militar_plantao', (table) => {
            table.increments('id').primary();
            table.integer('plantao_id').references('id').inTable('plantoes').onDelete('CASCADE').notNullable();
            table.integer('militar_id').references('id').inTable('militares').onDelete('CASCADE').notNullable();
            table.string('matricula_militar', 20);
            table.string('funcao', 100);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.unique(['plantao_id', 'militar_id']);
        });
    } else {
        // If it exists, ensure 'funcao' column exists
        const hasFuncao = await knex.schema.hasColumn('militar_plantao', 'funcao');
        if (!hasFuncao) {
            await knex.schema.table('militar_plantao', (table) => {
                table.string('funcao', 100);
            });
        }
    }
};

exports.down = function (knex) {
    // We generally don't want to drop data in production fixes, 
    // but standard rollback would drop the table if we created it.
    // Since this is a "fix" migration, safe to ignore down or strictly revert additions.
};
