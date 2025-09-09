// Arquivo: backend/src/database/migrations/<timestamp>_refactor_viaturas_for_denormalization.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('viaturas', function(table) {
    // 1. Remove a coluna de chave estrangeira 'obm_id' se ela existir.
    // O 'if' é uma proteção para evitar erros se a coluna já foi removida.
    table.dropColumn('obm_id');

    // 2. Adiciona as novas colunas de texto para armazenar os dados desnormalizados.
    //    Essas colunas virão diretamente da planilha.
    table.string('cidade', 100).nullable();
    table.string('obm', 150).nullable(); // Para o nome por extenso da OBM
    table.string('telefone', 20).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' reverte as alterações, caso precise voltar atrás.
  return knex.schema.alterTable('viaturas', function(table) {
    // 1. Adiciona a coluna 'obm_id' de volta.
    table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');

    // 2. Remove as colunas de texto que foram adicionadas.
    table.dropColumn('cidade');
    table.dropColumn('obm');
    table.dropColumn('telefone');
  });
};
