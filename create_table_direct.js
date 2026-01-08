require('dotenv').config();
const { knex } = require('knex');

// Use EXACT same connection as runtime (from env.ts logic)
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

async function createTable() {
    try {
        console.log('Connecting to runtime database...');
        console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'YES' : 'NO');

        const exists = await db.schema.hasTable('militar_plantao');

        if (exists) {
            console.log('✅ Table already exists!');
        } else {
            console.log('Creating militar_plantao table...');
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
        }

        // Verify
        const stillExists = await db.schema.hasTable('militar_plantao');
        console.log('\nFinal verification - Table exists:', stillExists);

        await db.destroy();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        await db.destroy();
        process.exit(1);
    }
}

createTable();
