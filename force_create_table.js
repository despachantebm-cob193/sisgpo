require('dotenv').config();
const { knex } = require('knex');

const config = {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || process.env.DB_NAME,
        ssl: false,
    },
};

const db = knex(config);

async function forceCreate() {
    try {
        console.log('Force creating table...');

        // Drop table if exists (this will drop all constraints too)
        await db.schema.dropTableIfExists('militar_plantao');
        console.log('Dropped any existing table/constraints');

        // Create fresh
        await db.schema.createTable('militar_plantao', (table) => {
            table.increments('id').primary();
            table.integer('plantao_id').references('id').inTable('plantoes').onDelete('CASCADE').notNullable();
            table.integer('militar_id').references('id').inTable('militares').onDelete('CASCADE').notNullable();
            table.string('matricula_militar', 20);
            table.string('funcao', 100);
            table.timestamp('created_at').defaultTo(db.fn.now());
            table.unique(['plantao_id', 'militar_id']);
        });
        console.log('✅ Table created successfully!');

        // Verify
        const exists = await db.schema.hasTable('militar_plantao');
        console.log('Verification - Table exists:', exists);

        if (exists) {
            const count = await db('militar_plantao').count('* as cnt');
            console.log('Row count:', count[0].cnt);
        }

        await db.destroy();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
        await db.destroy();
        process.exit(1);
    }
}

forceCreate();
