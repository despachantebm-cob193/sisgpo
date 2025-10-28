// Arquivo: backend/__tests__/globalSetup.js
require('dotenv').config({ path: './.env.test' });
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  console.log('[Global Setup] Iniciando configuracao do ambiente de teste...');

  try {
    console.log('[Global Setup] Limpando tabelas...');
    await db('plantoes_militares').del();
    await db('plantoes').del();
    await db('militares').del();
    await db('viaturas').del();
    await db('obms').del();
    await db('usuarios').del();
    console.log('[Global Setup] Tabelas limpas.');

    console.log('[Global Setup] Criando usuario "admin" para os testes...');
    const senhaPlana = 'cbmgo@2025';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await db('usuarios').insert({
      login: 'admin',
      nome: 'admin',
      email: 'admin@test.com',
      nome_completo: 'Admin Teste',
      senha_hash: senhaHash,
      perfil: 'admin',
      ativo: true,
    });
    console.log('[Global Setup] Usuario "admin" criado.');

    console.log('[Global Setup] Inserindo dados de suporte (OBM de Teste)...');
    await db('obms').insert({
      nome: 'Comando Geral de Teste',
      abreviatura: 'CG-TESTE',
      cidade: 'Goiania',
      telefone: '6232010000',
    });
    console.log('[Global Setup] OBM de Teste inserida com sucesso.');
  } catch (error) {
    console.error('ERRO CRITICO no Global Setup:', error);
    process.exit(1);
  }

  console.log('OK. [Global Setup] Ambiente de teste configurado com sucesso.');
};
