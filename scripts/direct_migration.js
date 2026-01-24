const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function runMigration() {
    console.log('Tentando conexao direta via pg...');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL nao definida.');
        return;
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Conectado com sucesso! Executando ALTER TABLE...');

        // Simple query, no prepared statements, should pass through Transaction Pooler
        await client.query('ALTER TABLE militares ADD COLUMN IF NOT EXISTS foto_url TEXT NULL;');

        console.log('Sucesso! Coluna foto_url adicionada (ou ja existia).');
    } catch (err) {
        console.error('Erro ao executar migracao:', err);
    } finally {
        await client.end();
    }
}

runMigration();
