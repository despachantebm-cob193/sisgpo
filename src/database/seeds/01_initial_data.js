// src/database/seeds/01_initial_data.js
const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 1. Limpa os dados existentes em ordem de dependência para evitar erros
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

  // 3. Insere OBMs e captura os IDs retornados
  const [obmPrincipal] = await knex('obms').insert([
    { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', ativo: true },
    { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', ativo: true },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', ativo: true }
  ]).returning('id'); // <-- Pede ao Knex para retornar o ID do primeiro item inserido

  // A variável 'obmPrincipal' agora contém um objeto como { id: 1 }
  // Usamos 'obmPrincipal.id' para garantir a referência correta.

  // 4. Insere uma viatura usando o ID da OBM capturado
  await knex('viaturas').insert([
    { 
      prefixo: 'UR-150', 
      placa: 'ABC1D23', 
      modelo: 'Sprinter', 
      ano: 2022, 
      tipo: 'UR', 
      ativa: true, 
      obm_id: obmPrincipal.id // <-- Uso seguro do ID
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
      obm_id: obmPrincipal.id // <-- Uso seguro do ID
    }
  ]);

  console.log('Seed de dados iniciais (versão 2) executado com sucesso!');
};
