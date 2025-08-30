// src/database/seeds/01_initial_data.js
const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 1. Limpa os dados existentes para evitar duplicatas ao rodar o seed múltiplas vezes
  await knex('plantoes_militares').del();
  await knex('plantoes').del();
  await knex('militares').del();
  await knex('viaturas').del();
  await knex('obms').del();
  await knex('usuarios').del();

  // 2. Insere o usuário 'admin'
  const senhaPlana = 'cbmgo@2025'; // Use uma senha segura em um projeto real
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senhaPlana, salt);

  await knex('usuarios').insert([
    { login: 'admin', senha_hash: senhaHash, perfil: 'Admin' }
  ]);

  // 3. Insere algumas OBMs de exemplo
  await knex('obms').insert([
    { nome: '1º Batalhão Bombeiro Militar', abreviatura: '1º BBM', cidade: 'Goiânia', ativo: true },
    { nome: 'Comando de Apoio Logístico', abreviatura: 'CAL', cidade: 'Goiânia', ativo: true },
    { nome: 'Academia Bombeiro Militar', abreviatura: 'ABM', cidade: 'Goiânia', ativo: true }
  ]);

  console.log('Seed de dados iniciais executado com sucesso!');
};
