// Arquivo: backend/src/server.js (Confirmar que está assim)

const app = require('./app');
const db = require('./config/database');
const bootstrapDatabase = require('./bootstrap');

const PORT = process.env.PORT || 3333;

async function startServer() {
  try {
    console.log('[Server Start] Verificando e aplicando migrações do banco de dados...');
    await db.migrate.latest(); // 1. Roda as migrações PRIMEIRO
    console.log('[Server Start] Migrações concluídas com sucesso.');

    await bootstrapDatabase(); // 2. Roda o bootstrap DEPOIS

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error('❌ FALHA CRÍTICA AO INICIAR O SERVIDOR ❌');
    console.error(error);
    process.exit(1);
  }
}

startServer();