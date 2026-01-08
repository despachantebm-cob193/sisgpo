import { Knex, knex } from 'knex';
import env from './env';

const config: Knex.Config = {
    client: 'pg',
    connection: env.DB.URL || {
        host: env.DB.HOST,
        port: env.DB.PORT,
        user: env.DB.USER,
        password: env.DB.PASSWORD,
        database: env.DB.NAME,
        ssl: env.DB.SSL ? { rejectUnauthorized: false } : false,
    },
    pool: { min: 2, max: 10 },
    searchPath: ['public'],
};

const db = knex(config);

export default db;
