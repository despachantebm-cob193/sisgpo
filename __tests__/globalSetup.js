// Arquivo: backend/__tests__/globalSetup.js
require('dotenv').config({ path: './.env.test' });
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  console.log('[Global Setup] Iniciando configuração do ambiente de teste...');

  try {
    // 1. Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
    console.log('[Global Setup] Limpando tabelas...');
    await db('plantoes_militares').del();
    await db('plantoes').del();
    await db('militares').del();
    await db('viaturas').del();
    await db('obms').del();
    await db('usuarios').del();
    console.log('[Global Setup] Tabelas limpas.');

    // 2. Cria o usuário 'admin' para os testes
    console.log('[Global Setup] Criando usuário "admin" para os testes...');
    const senhaPlana = 'cbmgo@2025';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);
    await db('usuarios').insert({
      login: 'admin',
      senha_hash: senhaHash,
      perfil: 'admin'
    });
    console.log('[Global Setup] Usuário "admin" criado.');

    // --- CORREÇÃO PRINCIPAL APLICADA AQUI ---
    // 3. Insere uma OBM de teste que estará disponível para todos os testes
    console.log('[Global Setup] Inserindo dados de suporte (OBM de Teste)...');
    await db('obms').insert({
        nome: 'Comando Geral de Teste',
        abreviatura: 'CG-TESTE',
        cidade: 'Goiânia',
        telefone: '6232010000'
    });
    console.log('[Global Setup] OBM de Teste inserida com sucesso.');
    // --- FIM DA CORREÇÃO ---

  } catch (error) {
    console.error('❌ ERRO CRÍTICO no Global Setup:', error);
    process.exit(1); // Aborta a execução dos testes se o setup falhar
  }

  console.log('✅ [Global Setup] Ambiente de teste configurado com sucesso.');
};
