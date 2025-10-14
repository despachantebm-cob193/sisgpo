// src/database/seeds/02_escala_aeronaves_seed.js

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  
  // Funcao auxiliar para deletar dados de uma tabela e ignorar se a tabela nao existir.
  const cleanTable = async (tableName) => {
    try {
      // Usa TRUNCATE para limpar e resetar sequências (melhor para PostgreSQL)
      await knex.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
      console.log(`[Seed Clean] Tabela "${tableName}" limpa.`);
    } catch (error) {
      // 42P01 é o código de erro do PostgreSQL para 'relation does not exist'
      if (error.code === '42P01' || error.message.includes('not exist')) { 
        console.warn(`[Seed Clean] Tabela "${tableName}" não existe. Ignorando.`);
      } else {
        throw error;
      }
    }
  };

  // --- 1. Limpeza de Dados (Tabelas de Escala de Aeronaves) ---
  console.log("Iniciando seed de dados de escala de aeronaves...");
  
  // Limpeza robusta das tabelas de escala (resolverá o erro atual do log).
  await cleanTable('escala_aeronaves');
  await cleanTable('aeronaves');
  
  // --- 2. Inserção de Dados de Teste ---

  // Busca o militar de teste criado no seed 01
  const militar1 = await knex('militares').where({ matricula: '123456' }).first();
  
  // Exemplo de inserção de Aeronave (somente se a tabela foi criada por migração)
  try {
      const [aeronave1, aeronave2] = await knex('aeronaves').insert([
        {
          prefixo: 'AS-100',
          tipo_asa: 'Fixa',
          modelo: 'Caravan',
          disponivel: true,
        },
        {
          prefixo: 'AS-200',
          tipo_asa: 'Rotativa',
          modelo: 'Esquilo',
          disponivel: true,
        }
      ]).returning('*');

      // Exemplo de inserção de Escala (depende de militares e aeronaves)
      if (militar1) {
          await knex('escala_aeronaves').insert([
              {
                  data: knex.fn.now(),
                  aeronave_id: aeronave1.id,
                  primeiro_piloto_id: militar1.id,
                  status: 'DISPONIVEL',
              }
          ]);
      }
  } catch (e) {
      // Captura erros de inserção se alguma coluna crítica (como 'tipo_asa') ainda não existir.
      console.warn("Não foi possível inserir dados de aeronaves. Isso é normal se o schema não estiver completo.", e.message);
  }


  console.log('Seed de escala de aeronaves concluído com sucesso.');
};