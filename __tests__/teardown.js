// Arquivo: backend/__tests__/teardown.js
const db = require('../src/config/database');

module.exports = async () => {
  console.log('[Global Teardown] Encerrando a conexão com o banco de dados...');
  // --- CORREÇÃO APLICADA AQUI ---
  // Usa db.destroy() para fechar todas as conexões do pool do Knex
  await db.destroy();
  // -----------------------------
  console.log('[Global Teardown] Conexão com o banco de dados encerrada.');
};
