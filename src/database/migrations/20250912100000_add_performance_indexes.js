// Arquivo: src/database/migrations/20250912100000_add_performance_indexes.js

/**
 * Função auxiliar para verificar se um índice existe no PostgreSQL.
 * @param {import("knex").Knex} knex - A instância do Knex.
 * @param {string} tableName - O nome da tabela.
 * @param {string} indexName - O nome do índice.
 * @returns {Promise<boolean>}
 */
async function indexExists(knex, tableName, indexName) {
  const result = await knex.raw(
    "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?",
    [tableName, indexName]
  );
  return result.rows.length > 0;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('Fase 1 de Otimização: Aplicando índices de desempenho de forma segura...');

  // Tabela: militares
  if (!(await indexExists(knex, 'militares', 'idx_militares_nomes'))) {
    await knex.schema.alterTable('militares', function(table) {
      console.log(' -> Criando índice em "militares"...');
      table.index(['nome_completo', 'nome_guerra'], 'idx_militares_nomes');
    });
  }

  // Tabela: viaturas
  if (!(await indexExists(knex, 'viaturas', 'idx_viaturas_obm'))) {
    await knex.schema.alterTable('viaturas', function(table) {
      console.log(' -> Criando índice em "viaturas"...');
      table.index('obm', 'idx_viaturas_obm');
    });
  }

  // Tabela: servico_dia
  if (!(await indexExists(knex, 'servico_dia', 'idx_servico_dia_data'))) {
    await knex.schema.alterTable('servico_dia', function(table) {
      console.log(' -> Criando índice em "servico_dia"...');
      table.index('data', 'idx_servico_dia_data');
    });
  }

  // Tabela: escala_aeronaves
  if (!(await indexExists(knex, 'escala_aeronaves', 'idx_escala_aeronaves_data'))) {
    await knex.schema.alterTable('escala_aeronaves', function(table) {
      console.log(' -> Criando índice em "escala_aeronaves"...');
      table.index('data', 'idx_escala_aeronaves_data');
    });
  }

  // Tabela: escala_codec
  if (!(await indexExists(knex, 'escala_codec', 'idx_escala_codec_data_turno'))) {
    await knex.schema.alterTable('escala_codec', function(table) {
      console.log(' -> Criando índice em "escala_codec"...');
      table.index(['data', 'turno'], 'idx_escala_codec_data_turno');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('Revertendo Fase 1 de Otimização: Removendo índices de desempenho...');

  // A lógica de 'down' também se beneficia da verificação de existência.
  if (await indexExists(knex, 'militares', 'idx_militares_nomes')) {
    await knex.schema.alterTable('militares', function(table) {
      table.dropIndex(['nome_completo', 'nome_guerra'], 'idx_militares_nomes');
    });
  }

  if (await indexExists(knex, 'viaturas', 'idx_viaturas_obm')) {
    await knex.schema.alterTable('viaturas', function(table) {
      table.dropIndex('obm', 'idx_viaturas_obm');
    });
  }

  if (await indexExists(knex, 'servico_dia', 'idx_servico_dia_data')) {
    await knex.schema.alterTable('servico_dia', function(table) {
      table.dropIndex('data', 'idx_servico_dia_data');
    });
  }

  if (await indexExists(knex, 'escala_aeronaves', 'idx_escala_aeronaves_data')) {
    await knex.schema.alterTable('escala_aeronaves', function(table) {
      table.dropIndex('data', 'idx_escala_aeronaves_data');
    });
  }

  if (await indexExists(knex, 'escala_codec', 'idx_escala_codec_data_turno')) {
    await knex.schema.alterTable('escala_codec', function(table) {
      table.dropIndex(['data', 'turno'], 'idx_escala_codec_data_turno');
    });
  }
};
