
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

async function run() {
    try {
        console.log('Sending NOTIFY pgrst, "reload config" to database...');
        await knex.raw("NOTIFY pgrst, 'reload config'");
        console.log('Command sent successfully. PostgREST schema cache should refresh shortly.');
        process.exit(0);
    } catch (err) {
        console.error('Error reloading schema cache:', err);
        process.exit(1);
    }
}

run();
