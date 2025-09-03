/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('viaturas', function(table) {
    // 1. Adiciona as novas colunas de texto
    table.string('cidade', 100);
    table.string('obm', 150); // Para armazenar o nome completo da OBM
    table.string('telefone', 20);

    // 2. Remove a coluna de chave estrangeira que fazia o vínculo
    table.dropColumn('obm_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' reverte as alterações
  return knex.schema.alterTable('viaturas', function(table) {
    table.dropColumn('cidade');
    table.dropColumn('obm');
    table.dropColumn('telefone');
    
    // Recria a coluna de chave estrangeira
    table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');
  });
};
