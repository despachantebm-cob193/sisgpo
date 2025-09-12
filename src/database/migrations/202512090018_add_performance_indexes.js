/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  console.log('Fase 1 de Otimização: Aplicando índices de desempenho...');
  return knex.schema
    // Tabela: militares
    // Justificativa: A busca por nome/nome de guerra é uma operação comum no frontend.
    .alterTable('militares', function(table) {
      table.index(['nome_completo', 'nome_guerra'], 'idx_militares_nomes');
    })
    // Tabela: viaturas
    // Justificativa: A busca por OBM (texto) é usada nos dashboards.
    .alterTable('viaturas', function(table) {
      table.index('obm', 'idx_viaturas_obm');
    })
    // Tabela: servico_dia
    // Justificativa: A consulta principal nesta tabela é sempre filtrada por data.
    .alterTable('servico_dia', function(table) {
      table.index('data', 'idx_servico_dia_data');
    })
    // Tabela: escala_aeronaves
    // Justificativa: As escalas de aeronaves são frequentemente filtradas por data.
    .alterTable('escala_aeronaves', function(table) {
      table.index('data', 'idx_escala_aeronaves_data');
    })
    // Tabela: escala_codec
    // Justificativa: As consultas são sempre por data e, às vezes, por turno.
    .alterTable('escala_codec', function(table) {
      table.index(['data', 'turno'], 'idx_escala_codec_data_turno');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  console.log('Revertendo Fase 1 de Otimização: Removendo índices de desempenho...');
  return knex.schema
    .alterTable('militares', function(table) {
      table.dropIndex(['nome_completo', 'nome_guerra'], 'idx_militares_nomes');
    })
    .alterTable('viaturas', function(table) {
      table.dropIndex('obm', 'idx_viaturas_obm');
    })
    .alterTable('servico_dia', function(table) {
      table.dropIndex('data', 'idx_servico_dia_data');
    })
    .alterTable('escala_aeronaves', function(table) {
      table.dropIndex('data', 'idx_escala_aeronaves_data');
    })
    .alterTable('escala_codec', function(table) {
      table.dropIndex(['data', 'turno'], 'idx_escala_codec_data_turno');
    });
};
