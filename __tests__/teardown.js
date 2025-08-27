const pool = require('../src/config/database');

module.exports = async () => {
  console.log('[Global Teardown] Encerrando a conexão com o banco de dados...');
  await pool.end(); // Garante que a conexão com o pool seja encerrada
  console.log('[Global Teardown] Conexão com o banco de dados encerrada.');
};
