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
            loadExtensions: ['.ts', '.js'],
        },
        seeds: {
            directory: './src/database/seeds',
            loadExtensions: ['.ts', '.js'],
        },
    },

    test: {
        client: 'pg',
        connection: process.env.DATABASE_URL
            ? {
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
            }
            : getLocalConnection(),
        pool: { min: 0, max: 1 }, // Reduce pool size for tests to avoid connection limits
        migrations: {
            directory: './src/database/migrations',
            loadExtensions: ['.ts', '.js'],
        },
        seeds: {
            directory: './src/database/seeds',
            loadExtensions: ['.ts', '.js'],
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
