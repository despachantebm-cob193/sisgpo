// Arquivo: backend/src/database/seeds/01_initial_data.js (VERSAO FINAL CORRIGIDA)

const bcrypt = require('bcryptjs');

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
        // Se for outro erro, lançamos novamente
        throw error;
      }
    }
  };
  
  // --- 1. Limpeza de Dados (Ordenada por dependência reversa) ---
  console.log("Iniciando limpeza de dados...");
  
  // Tabelas de escala (que frequentemente causam o erro inicial)
  await cleanTable('escala_codec'); 
  await cleanTable('escala_aeronaves');
  await cleanTable('escala_medicos');
  
  // Relações e tabelas principais que dependem de outras
  await cleanTable('militar_plantao');
  await cleanTable('viatura_plantao');
  await cleanTable('servico_dia');
  await cleanTable('aeronaves');
  await cleanTable('plantoes');
  await cleanTable('viaturas');
  await cleanTable('obms');
  await cleanTable('militares');
  await cleanTable('civis'); 
  await cleanTable('medicos');
  
  // Limpeza final de usuários
  await cleanTable('usuarios');

  // --- 2. Inserção de Usuário Admin (Garante o acesso) ---
  console.log("Inserindo usuário admin e dados essenciais...");

  const senhaPlana = 'cbmgo@2025';
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senhaPlana, salt);
  
  // CORREÇÃO 1: Removendo 'ativo: true' para resolver o erro de coluna em 'usuarios'.
  await knex('usuarios').insert([
    { login: 'admin', nome: 'Admin', nome_completo: 'Admin', email: 'admin@example.com', senha_hash: senhaHash, perfil: 'admin', status: 'approved' }
  ]);

  // --- 3. Inserção de Dados de Teste ---
  
  // Inserindo OBMs
  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1o Batalhao Bombeiro Militar', abreviatura: '1o BBM', cidade: 'Goiania', telefone: '6232012030' },
    { nome: 'Comando de Apoio Logistico', abreviatura: 'CAL', cidade: 'Goiania', telefone: '6232012040' },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiania', telefone: '6232012050' },
    { nome: 'CENTRO DE OPERACOES AEREAS', abreviatura: 'COA', cidade: 'Goiania', telefone: '6232012060' }
  ]).returning('*');

  // Inserindo Viaturas
  await knex('viaturas').insert([
    {
      prefixo: 'UR-150',
      ativa: true,
      cidade: 'Goiania',
      obm: '1o Batalhao Bombeiro Militar',
      telefone: '6232012030'
    }
  ]);

  // Inserindo Militares
  await knex('militares').insert([
    {
      matricula: '123456',
      nome_completo: 'Sd. Fulano de Tal',
      nome_guerra: 'Fulano',
      posto_graduacao: 'Soldado',
      ativo: true,
      obm_nome: obmPrincipal.nome
    }
  ]);

  // CORREÇÃO 2: Removendo 'telefone' da inserção em 'civis'
  await knex('civis').insert([
    {
      nome_completo: 'Dr. Beltrano de Souza',
      funcao: 'Medico Regulador',
      ativo: true
    }
  ]);

  console.log('Seed de dados iniciais (corrigido) executado com sucesso!');
};