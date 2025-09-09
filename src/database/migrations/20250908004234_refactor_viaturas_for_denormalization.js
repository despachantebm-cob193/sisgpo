// Arquivo: backend/src/database/migrations/<timestamp>_refactor_viaturas_for_denormalization.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Vamos usar knex.schema.alterTable para modificar a tabela existente
  await knex.schema.alterTable('viaturas', function(table) {
    
    // Verifica e remove a coluna 'obm_id' se ela existir
    knex.schema.hasColumn('viaturas', 'obm_id').then(exists => {
      if (exists) {
        table.dropColumn('obm_id');
      }
    });

    // Verifica e adiciona a coluna 'cidade' apenas se ela não existir
    knex.schema.hasColumn('viaturas', 'cidade').then(exists => {
      if (!exists) {
        table.string('cidade', 100).nullable();
      }
    });

    // Verifica e adiciona a coluna 'obm' apenas se ela não existir
    knex.schema.hasColumn('viaturas', 'obm').then(exists => {
      if (!exists) {
        table.string('obm', 150).nullable();
      }
    });

    // Verifica e adiciona a coluna 'telefone' apenas se ela não existir
    knex.schema.hasColumn('viaturas', 'telefone').then(exists => {
      if (!exists) {
        table.string('telefone', 20).nullable();
      }
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // A função 'down' reverte as alterações, caso precise voltar atrás.
  return knex.schema.alterTable('viaturas', function(table) {
    // Adiciona a coluna 'obm_id' de volta.
    table.integer('obm_id').unsigned().references('id').inTable('obms').onDelete('SET NULL');

    // Remove as colunas de texto que foram adicionadas.
    table.dropColumn('cidade');
    table.dropColumn('obm');
    table.dropColumn('telefone');
  });
};
