import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const getLocalConnection = () => ({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    ssl: false,
});

const config: { [key: string]: Knex.Config } = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL || getLocalConnection(),
        migrations: {
            directory: './src/database/migrations',
            extension: 'js', // Keep strict to JS if migrations are JS, or 'ts' if converted. Current migrations are JS.
        },
        seeds: {
            directory: './src/database/seeds',
            extension: 'js',
        },
    },

    test: {
        client: 'pg',
        connection: getLocalConnection(),
        migrations: {
            directory: './src/database/migrations',
        },
        seeds: {
            directory: './src/database/seeds',
        },
    },

    production: {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
        },
        migrations: {
            directory: './src/database/migrations',
        },
        seeds: {
            directory: './src/database/seeds',
        },
    },
};

export default config;
