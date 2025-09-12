// Arquivo: backend/src/database/migrations/<timestamp>_re_add_schedule_fields_to_civis.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Adiciona novamente as colunas de escala à tabela 'civis'
  return knex.schema.alterTable('civis', function (table) {
    console.log("Restaurando colunas de escala na tabela 'civis'...");
    
    // Adiciona as colunas que foram removidas anteriormente
    table.timestamp('entrada_servico').nullable();
    table.timestamp('saida_servico').nullable();
    table.string('status_servico', 20).defaultTo('Presente').notNullable();
    
    // A coluna 'observacoes' já deve existir, mas garantimos aqui
    if (!knex.schema.hasColumn('civis', 'observacoes')) {
        table.text('observacoes').nullable();
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' reverte a operação, removendo as colunas novamente
  return knex.schema.alterTable('civis', function (table) {
    console.log("Removendo colunas de escala da tabela 'civis'...");
    table.dropColumn('entrada_servico');
    table.dropColumn('saida_servico');
    table.dropColumn('status_servico');
  });
};
