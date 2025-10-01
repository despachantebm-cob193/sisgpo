// Arquivo: backend/src/database/seeds/01_initial_data.js (VERSÃO CORRIGIDA)

const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // 1. Limpa os dados existentes em ordem de dependência para evitar conflitos
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

  // 2. Insere o usuário 'admin'
  const senhaPlana = 'cbmgo@2025';
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senhaPlana, salt);
  await knex('usuarios').insert([
    { login: 'admin', senha_hash: senhaHash, perfil: 'admin' }
  ]);

  // 3. Insere OBMs de exemplo
  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', telefone: '6232012030' },
    { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', telefone: '6232012040' },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', telefone: '6232012050' },
    { nome: 'CENTRO DE OPERAÇÕES AÉREAS', abreviatura: 'COA', cidade: 'Goiânia', telefone: '6232012060' }
  ]).returning('*'); // Retorna o objeto completo para pegar o nome

  // 4. Insere uma viatura de exemplo
  await knex('viaturas').insert([
    {
      prefixo: 'UR-150',
      ativa: true,
      cidade: 'Goiânia',
      obm: '1º Batalhão Bombeiro Militar', // Usa o nome da OBM
      telefone: '6232012030'
    }
  ]);

  // --- CORREÇÃO APLICADA AQUI ---
  // 5. Insere um MILITAR de exemplo usando a nova estrutura com 'obm_nome'
  await knex('militares').insert([
    {
      matricula: '123456',
      nome_completo: 'Sd. Fulano de Tal',
      nome_guerra: 'Fulano',
      posto_graduacao: 'Soldado',
      ativo: true,
      obm_nome: obmPrincipal.nome // <-- USA A COLUNA 'obm_nome' EM VEZ DE 'obm_id'
    }
  ]);
  // --- FIM DA CORREÇÃO ---

  // 6. Insere um registro de exemplo na tabela 'civis' (médicos)
  await knex('civis').insert([
    {
      nome_completo: 'Dr. Beltrano de Souza',
      funcao: 'Médico Regulador',
      telefone: '62987654321',
      ativo: true
    }
  ]);

  console.log('Seed de dados iniciais (corrigido) executado com sucesso!');
};
