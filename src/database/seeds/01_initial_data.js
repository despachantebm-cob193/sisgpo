const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // 1. Limpa os dados existentes em ordem de dependência
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
    { login: 'admin', senha_hash: senhaHash, perfil: 'Admin' }
  ]);

  // 3. Insere OBMs de exemplo, incluindo as novas para a escala médica
  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', telefone: '6232012030' },
    { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', telefone: '6232012040' },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', telefone: '6232012050' },
    { nome: 'Central de Operações Bombeiro', abreviatura: 'COB', cidade: 'Goiânia', telefone: '193' },
    { nome: 'Batalhão de Salvamento em Emergência', abreviatura: 'BSE', cidade: 'Goiânia', telefone: '6232012000' }
  ]).returning('id');

  // 4. Insere uma viatura de exemplo
  await knex('viaturas').insert([
    {
      prefixo: 'UR-150',
      ativa: true,
      cidade: 'Goiânia',
      obm: '1º Batalhão Bombeiro Militar',
      telefone: '6232012030'
    }
  ]);

  // 5. Insere um MILITAR de exemplo
  await knex('militares').insert([
    {
      matricula: '123456',
      nome_completo: 'Sd. Fulano de Tal',
      nome_guerra: 'Fulano',
      posto_graduacao: 'Soldado',
      ativo: true,
      obm_id: obmPrincipal.id
    }
  ]);

  // --- CORREÇÃO APLICADA AQUI ---
  // 6. Insere um registro de exemplo na tabela 'civis' com a NOVA ESTRUTURA
  await knex('civis').insert([
    {
      nome_completo: 'Dr. Beltrano de Souza',
      funcao: 'Médico Regulador',
      entrada_servico: new Date('2025-09-06T07:00:00Z'), // Exemplo de data/hora
      saida_servico: new Date('2025-09-06T19:00:00Z'),
      status_servico: 'Presente',
      observacoes: 'Serviço normal.',
      ativo: true
    }
  ]);

  console.log('Seed de dados (com nova estrutura de escala) executado com sucesso!');
};
