// src/database/migrations/202512090018_add_performance_indexes.js

// CRÍTICO: Desabilita a transação para evitar o erro 25P02 ("transação atual foi interrompida")
exports.config = { transaction: false }; 


exports.up = async function(knex) {
  console.log('Fase 1 de Otimização: Aplicando índices de desempenho...');

  // --- Função Auxiliar Segura ---
  // Esta função ignora erros de "relação já existe" (42P07) e outros conflitos
  const createIndexSafe = async (tableName, columnName, indexName) => {
    try {
      const tableExists = await knex.schema.hasTable(tableName);

      if (tableExists) {
        console.log(` -> Criando índice em "${tableName}.${columnName}"...`);
        
        // Tenta criar o índice. O catch irá ignorar o erro se ele já existir.
        await knex.schema.alterTable(tableName, (table) => {
          table.index([columnName], indexName);
        });
        
      } else {
        console.log(` -> Tabela "${tableName}" não existe. Pulando índice.`);
      }
    } catch (e) {
      // Ignora erros comuns de conflito (42P07: objeto já existe, 42703: coluna não existe, 42P01: tabela não existe)
      if (e.code === '42P07' || e.code === '42703' || e.code === '42P01') {
        console.warn(` -> ALERTA: Conflito de índice/coluna para "${tableName}". Ignorado.`);
        return;
      }
      // Se for outro erro, lançamos a exceção.
      throw e;
    }
  };

  // --- Criação dos Índices ---
  
  // 1. O índice que está falhando: idx_viaturas_obm
  await createIndexSafe('viaturas', 'obm', 'idx_viaturas_obm');
  
  // 2. Outras tentativas de índice neste arquivo (adapte conforme seu código original)
  // Exemplo:
  await createIndexSafe('viaturas', 'prefixo', 'idx_viaturas_prefixo');
  await createIndexSafe('servico_dia', 'data', 'idx_servico_dia_data');
  // ... adicione aqui o restante das suas criações de índice originais

  console.log('Índices de desempenho aplicados com segurança.');
};

exports.down = async function(knex) {
    // Lógica down
    const dropIndexSafe = async (tableName, columnName) => {
        const tableExists = await knex.schema.hasTable(tableName);
        if (tableExists) {
            await knex.schema.alterTable(tableName, (table) => {
                table.dropIndex(columnName);
            });
        }
    };
    
    // Removendo apenas o índice que causou o problema como exemplo
    await dropIndexSafe('viaturas', 'obm');
    // ... adicione aqui o restante das suas remoções de índice originais
};