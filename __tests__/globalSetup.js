require('dotenv').config({ path: './.env' });
const pool = require('../src/config/database');
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

  // 1. Limpa todas as tabelas na ordem correta
  console.log('[Global Setup] Limpando tabelas...');
  for (const tabela of tabelas) {
    try {
      await pool.query(`DELETE FROM ${tabela};`);
    } catch (error) {
      if (error.code !== '42P01') { // Ignora erro "tabela não existe"
        console.error(`Erro ao limpar a tabela ${tabela}:`, error);
        process.exit(1);
      }
    }
  }

  // 2. Cria o usuário admin para os testes
  console.log('[Global Setup] Criando usuário "admin" para os testes...');
  try {
    const senhaPlana = 'cbmgo@2025';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaPlana, salt);

    await pool.query(
      'INSERT INTO usuarios (login, senha_hash, perfil) VALUES ($1, $2, $3)',
      ['admin', senhaHash, 'Admin']
    );
  } catch (error) {
    console.error('Erro ao criar usuário admin no setup global:', error);
    process.exit(1);
  }

  console.log('[Global Setup] Ambiente de teste configurado com sucesso.');
};
