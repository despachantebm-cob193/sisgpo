/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('test_logs', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.timestamp('executed_at').defaultTo(knex.fn.now());
        table.string('perfil').notNullable(); // admin, user
        table.jsonb('results').notNullable(); // Detalhes dos testes
        table.boolean('success').notNullable();
        table.text('ai_suggestions'); // Sugestões da IA para falhas
        table.integer('broken_links_count').defaultTo(0);
        table.integer('forbidden_access_count').defaultTo(0);
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('test_logs');
};
