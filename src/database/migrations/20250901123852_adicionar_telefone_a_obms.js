/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('obms', function (table) {
    // Adiciona a nova coluna 'telefone' após a coluna 'cidade'
    table.string('telefone', 20).nullable().after('cidade');
    
    // Remove a coluna 'ativo'
    table.dropColumn('ativo');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('obms', function (table) {
    // Remove a coluna 'telefone'
    table.dropColumn('telefone');

    // Readiciona a coluna 'ativo' caso a migration seja revertida
    table.boolean('ativo').notNullable().defaultTo(true);
  });
};
