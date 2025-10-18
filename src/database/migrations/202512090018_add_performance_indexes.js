// src/database/migrations/202512090018_add_performance_indexes.js

// CRÍTICO: Desabilita a transação para evitar o erro 25P02 ("transação atual foi interrompida")
exports.config = { transaction: false };

exports.up = async function(knex) {
  console.log('Fase 1 de Otimização: Aplicando índices de desempenho...');

  const createIndexSafe = async (tableName, columnName, indexName) => {
    try {
      const tableExists = await knex.schema.hasTable(tableName);
      if (tableExists) {
        // Usando SQL bruto para criar o índice apenas se ele não existir
        await knex.raw(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("${columnName}")`);
        console.log(` -> Índice "${indexName}" em "${tableName}.${columnName}" criado ou já existente.`);
      }
    } catch (e) {
      console.error(` -> ERRO ao criar o índice "${indexName}":`, e.message);
    }
  };

  await createIndexSafe('viaturas', 'obm', 'idx_viaturas_obm');
  await createIndexSafe('viaturas', 'prefixo', 'idx_viaturas_prefixo');
  await createIndexSafe('servico_dia', 'data', 'idx_servico_dia_data');

  console.log('Índices de desempenho aplicados com segurança.');
};

exports.down = async function(knex) {
  console.log('Fase 1 de Otimização: Revertendo índices de desempenho...');

  const dropIndexSafe = async (indexName) => {
    try {
      // A forma mais segura de remover um índice é usar SQL bruto com IF EXISTS
      await knex.raw(`DROP INDEX IF EXISTS "${indexName}"`);
      console.log(` -> Índice "${indexName}" removido com sucesso ou já não existia.`);
    } catch (e) {
      console.error(` -> ERRO ao remover o índice "${indexName}":`, e.message);
    }
  };

  // Use os nomes exatos dos índices criados na função 'up'
  await dropIndexSafe('idx_viaturas_obm');
  await dropIndexSafe('idx_viaturas_prefixo');
  await dropIndexSafe('idx_servico_dia_data');

  console.log('Índices de desempenho revertidos com segurança.');
};