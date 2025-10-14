// src/database/migrations/20250912100000_add_performance_indexes.js

// CRÍTICO: Desabilita a transação para que erros internos (como criar índice em tabela inexistente)
// não abortem o estado de migração do Knex (código 25P02).
exports.config = { transaction: false }; 


exports.up = async function(knex) {
  console.log('Fase 1 de Otimização: Aplicando índices de desempenho de forma segura...');

  // --- Função Auxiliar Segura (Simplificada e Aprimorada) ---
  const createIndexSafe = async (tableName, columnName, indexName) => {
    // Usamos um bloco try-catch simples, pois a transação está desabilitada.
    // Isso garante que o erro de "tabela não existe" (42P01) ou "coluna não existe" (42703) seja ignorado.
    try {
      const tableExists = await knex.schema.hasTable(tableName);

      if (tableExists) {
        console.log(` -> Criando índice em "${tableName}.${columnName}"...`);
        
        await knex.schema.alterTable(tableName, (table) => {
          table.index([columnName], indexName);
        });
        
      } else {
        console.log(` -> Tabela "${tableName}" não existe. Pulando índice.`);
      }
    } catch (e) {
      // Ignora os códigos de erro comuns de conflito (42703: coluna não existe, 42P01: tabela não existe)
      if (e.code === '42703' || e.code === '42P01') {
        console.warn(` -> ALERTA: Conflito de índice/coluna para "${tableName}". Ignorado.`);
        return;
      }
      // Outros erros ainda devem ser lançados para diagnóstico
      throw e;
    }
  };

  // --- Criação dos Índices ---
  
  await createIndexSafe('escala_aeronaves', 'data', 'idx_escala_aeronaves_data');
  await createIndexSafe('militares', 'matricula', 'idx_militares_matricula');
  await createIndexSafe('militares', 'obm_nome', 'idx_militares_obm');
  await createIndexSafe('viaturas', 'prefixo', 'idx_viaturas_prefixo');
  await createIndexSafe('viaturas', 'obm', 'idx_viaturas_obm');
  await createIndexSafe('servico_dia', 'data', 'idx_servico_dia_data');
  await createIndexSafe('usuarios', 'login', 'idx_usuarios_login');

  console.log('Índices de desempenho aplicados com segurança.');
};

exports.down = async function(knex) {
    // Lógica down simples para remover os índices
    const dropIndexSafe = async (tableName, columnName) => {
        const tableExists = await knex.schema.hasTable(tableName);
        if (tableExists) {
            await knex.schema.alterTable(tableName, (table) => {
                table.dropIndex(columnName);
            });
        }
    };
    
    await dropIndexSafe('escala_aeronaves', 'data');
    await dropIndexSafe('militares', 'matricula');
    await dropIndexSafe('militares', 'obm_nome');
    await dropIndexSafe('viaturas', 'prefixo');
    await dropIndexSafe('viaturas', 'obm');
    await dropIndexSafe('servico_dia', 'data');
    await dropIndexSafe('usuarios', 'login');
};