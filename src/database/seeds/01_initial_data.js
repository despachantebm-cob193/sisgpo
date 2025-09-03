// Arquivo: src/database/seeds/01_initial_data.js (Corrigido)
const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 1. Limpa os dados existentes em ordem de dependência
  await knex('plantoes_militares').del();
  await knex('plantoes').del();
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

  // 3. Insere OBMs (sem a coluna 'ativo') e captura os IDs
  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', telefone: '6232012030' },
    { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', telefone: '6232012040' },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', telefone: '6232012050' }
  ]).returning('id');

  // 4. Insere uma viatura (com a nova estrutura desnormalizada)
  await knex('viaturas').insert([
    { 
      prefixo: 'UR-150', 
      ativa: true, 
      // Dados desnormalizados preenchidos para exemplo
      cidade: 'Goiânia',
      obm: '1º Batalhão Bombeiro Militar',
      telefone: '6232012030'
    }
  ]);

  // 5. Insere um militar usando o ID da OBM capturado
  await knex('militares').insert([
    { 
      matricula: '123456', 
      nome_completo: 'Sd. Fulano de Tal', 
      nome_guerra: 'Fulano', 
      posto_graduacao: 'Soldado', 
      ativo: true, 
      obm_id: obmPrincipal.id // Mantém o vínculo aqui
    }
  ]);

  console.log('Seed de dados iniciais (versão final) executado com sucesso!');
};
