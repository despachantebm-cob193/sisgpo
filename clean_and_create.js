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

async function cleanAndCreate() {
    try {
        console.log('Cleaning up orphaned constraints...');

        // Try to drop the orphaned constraint directly
        try {
            await db.raw('DROP INDEX IF EXISTS militar_plantao_plantao_id_militar_id_unique CASCADE');
            console.log('Dropped orphaned index/constraint');
        } catch (e) {
            console.log('No orphaned constraint to drop (or failed):', e.message);
        }

        // Drop table completely
        await db.schema.dropTableIfExists('militar_plantao');
        console.log('Dropped table');

        // Create table WITHOUT using .unique() which creates the problematic constraint
        await db.schema.createTable('militar_plantao', (table) => {
            table.increments('id').primary();
            table.integer('plantao_id').references('id').inTable('plantoes').onDelete('CASCADE').notNullable();
            table.integer('militar_id').references('id').inTable('militares').onDelete('CASCADE').notNullable();
            table.string('matricula_militar', 20);
            table.string('funcao', 100);
            table.timestamp('created_at').defaultTo(db.fn.now());
            // DON'T use table.unique() - add it manually with a different name
        });

        // Add unique constraint with custom name to avoid conflict
        await db.raw(`
      ALTER TABLE militar_plantao 
      ADD CONSTRAINT militar_plantao_unique_combo 
      UNIQUE (plantao_id, militar_id)
    `);

        console.log('✅ Table created successfully with unique constraint!');

        // Verify
        const exists = await db.schema.hasTable('militar_plantao');
        console.log('Verification - Table exists:', exists);

        await db.destroy();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        await db.destroy();
        process.exit(1);
    }
}

cleanAndCreate();
