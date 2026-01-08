exports.up = async function (knex) {
    // Force create militar_plantao if it doesn't exist
    const exists = await knex.schema.hasTable('militar_plantao');

    if (!exists) {
        console.log('Creating militar_plantao table...');
        await knex.schema.createTable('militar_plantao', (table) => {
            table.increments('id').primary();
            table.integer('plantao_id').references('id').inTable('plantoes').onDelete('CASCADE').notNullable();
            table.integer('militar_id').references('id').inTable('militares').onDelete('CASCADE').notNullable();
            table.string('matricula_militar', 20);
            table.string('funcao', 100);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.unique(['plantao_id', 'militar_id']);
        });
        console.log('✅ militar_plantao table created successfully');
    } else {
        console.log('✅ militar_plantao table already exists');
    }
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('militar_plantao');
};
