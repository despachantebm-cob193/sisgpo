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
    searchPath: ['public'],
};

const db = knex(config);

async function verify() {
    try {
        console.log('Connecting with runtime config...');
        console.log('Database:', config.connection.database || 'from URL');
        console.log('Host:', config.connection.host || 'from URL');

        // Check if table exists
        const exists = await db.schema.hasTable('militar_plantao');
        console.log('Table militar_plantao exists:', exists);

        if (!exists) {
            console.log('\n❌ Table does NOT exist in this database!');
            console.log('This means migrations ran on a different database.');
            console.log('\nPlease run: npm run migrate:dev');
        } else {
            console.log('\n✅ Table EXISTS. Trying to query it...');
            const count = await db('militar_plantao').count('* as cnt');
            console.log('Row count:', count[0].cnt);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

verify();
