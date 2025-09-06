const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // 1. Limpa os dados existentes em ordem de dependência para evitar erros de chave estrangeira
  // A nova tabela 'civis' é adicionada aqui.
  await knex('plantoes_militares').del();
  await knex('plantoes').del();
  await knex('civis').del(); // <-- Limpa a nova tabela
  await knex('militares').del();
  await knex('viaturas').del();
  await knex('obms').del();
  await knex('usuarios').del();

  // 2. Insere o usuário 'admin' (sem alterações)
  const senhaPlana = 'cbmgo@2025';
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senhaPlana, salt);
  await knex('usuarios').insert([
    { login: 'admin', senha_hash: senhaHash, perfil: 'Admin' }
  ]);

  // 3. Insere OBMs de exemplo e captura o ID da primeira para usar nos exemplos
  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', telefone: '6232012030' },
    { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', telefone: '6232012040' },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', telefone: '6232012050' }
  ]).returning('id');

  // 4. Insere uma viatura de exemplo (sem alterações)
  await knex('viaturas').insert([
    {
      prefixo: 'UR-150',
      ativa: true,
      cidade: 'Goiânia',
      obm: '1º Batalhão Bombeiro Militar',
      telefone: '6232012030'
    }
  ]);

  // 5. Insere um MILITAR de exemplo na tabela 'militares'
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

  // 6. Insere um CIVIL de exemplo na nova tabela 'civis'
  await knex('civis').insert([
    {
      nome_completo: 'Beltrano de Souza',
      apelido: 'Beltrano', // Usando o campo 'apelido'
      ativo: true,
      obm_id: obmPrincipal.id
    }
  ]);

  console.log('Seed de dados iniciais (com separação de Civis) executado com sucesso!');
};
