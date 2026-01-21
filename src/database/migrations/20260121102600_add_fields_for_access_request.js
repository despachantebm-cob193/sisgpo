/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('usuarios', function (table) {
        table.string('whatsapp', 20);
        table.string('unidade', 100);
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('usuarios', function (table) {
        table.dropColumn('whatsapp');
        table.dropColumn('unidade');
    });
};
