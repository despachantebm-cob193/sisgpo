// Arquivo: backend/src/database/seeds/01_initial_data.js (VERSAO CORRIGIDA)

const bcrypt = require('bcryptjs');

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('escala_codec').del();
  await knex('escala_aeronaves').del();
  await knex('aeronaves').del();
  await knex('servico_dia').del();
  await knex('plantoes_militares').del();
  await knex('plantoes').del();
  await knex('civis').del();
  await knex('militares').del();
  await knex('viaturas').del();
  await knex('obms').del();
  await knex('usuarios').del();

  const senhaPlana = 'cbmgo@2025';
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senhaPlana, salt);
  await knex('usuarios').insert([
    { login: 'admin', senha_hash: senhaHash, perfil: 'admin', ativo: true }
  ]);

  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1o Batalhao Bombeiro Militar', abreviatura: '1o BBM', cidade: 'Goiania', telefone: '6232012030' },
    { nome: 'Comando de Apoio Logistico', abreviatura: 'CAL', cidade: 'Goiania', telefone: '6232012040' },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiania', telefone: '6232012050' },
    { nome: 'CENTRO DE OPERACOES AEREAS', abreviatura: 'COA', cidade: 'Goiania', telefone: '6232012060' }
  ]).returning('*');

  await knex('viaturas').insert([
    {
      prefixo: 'UR-150',
      ativa: true,
      cidade: 'Goiania',
      obm: '1o Batalhao Bombeiro Militar',
      telefone: '6232012030'
    }
  ]);

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

  await knex('civis').insert([
    {
      nome_completo: 'Dr. Beltrano de Souza',
      funcao: 'Medico Regulador',
      telefone: '62987654321',
      ativo: true
    }
  ]);

  console.log('Seed de dados iniciais (corrigido) executado com sucesso!');
};
