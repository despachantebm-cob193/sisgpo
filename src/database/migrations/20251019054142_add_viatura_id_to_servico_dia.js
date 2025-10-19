/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('servico_dia', function(table) {
    table.integer('viatura_id')
         .unsigned()
         .references('id')
         .inTable('viaturas')
         .onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Verifica se a coluna existe antes de tentar removê-la
  return knex.schema.hasColumn('servico_dia', 'viatura_id').then(exists => {
    if (exists) {
      return knex.schema.table('servico_dia', function(table) {
        table.dropColumn('viatura_id');
      });
    }
  });
};
