// Arquivo: __tests__/globalSetup.js (Corrigido)

// Carrega as variáveis de ambiente específicas para teste
require('dotenv').config({ path: './.env.test' });

// Importa a instância do Knex, que já está configurada para o ambiente de teste
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  console.log('[Global Setup] Iniciando configuração do ambiente de teste...');

  const tabelas = [
    'plantoes_militares',
    'plantoes',
    'militares',
    'viaturas',
    'obms',
    'usuarios'
  ];

  // 1. Limpa todas as tabelas na ordem correta usando a sintaxe do Knex
  console.log('[Global Setup] Limpando tabelas...');
  for (const tabela of tabelas) {
    try {
      // --- CORREÇÃO APLICADA AQUI ---
      // Usando a sintaxe do Knex para deletar os registros
      await db(tabela).del();
      // -----------------------------
    } catch (error) {
      // Ignora o erro "tabela não existe" (código 42P01 para PostgreSQL)
      // Isso permite que o teste rode mesmo na primeira vez, antes das migrations
      if (error.code !== '42P01') {
        console.error(`Erro ao limpar a tabela ${tabela}:`, error);
        process.exit(1);
      }
    }
  }

  // 2. Cria o usuário admin para os testes usando a sintaxe do Knex
  console.log('[Global Setup] Criando usuário "admin" para os testes...');
  try {
    const senhaPlana = 'cbmgo@2025';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);

    // --- CORREÇÃO APLICADA AQUI ---
    // Usando a sintaxe do Knex para inserir o usuário
    await db('usuarios').insert({
      login: 'admin',
      senha_hash: senhaHash,
      perfil: 'Admin'
    });
    // -----------------------------

  } catch (error) {
    console.error('Erro ao criar usuário admin no setup global:', error);
    process.exit(1);
  }

  console.log('[Global Setup] Ambiente de teste configurado com sucesso.');
};
