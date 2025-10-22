// Arquivo: src/server.ts (CORRIGIDO)
import http from 'http';
import app from './app'; // Importa o app.ts
import db from './config/database'; // Importa a config do DB (assumindo que é .js)
import bootstrapDatabase from './bootstrap'; // Importa o bootstrap (assumindo que é .js)

const PORT = process.env.PORT || 3333;

async function startServer() {
  try {
    console.log('[Server Start] Verificando e aplicando migrações do banco de dados...');
    await db.migrate.latest(); // 1. Roda as migrações
    console.log('[Server Start] Migrações concluídas com sucesso.');

    await bootstrapDatabase(); // 2. Roda o bootstrap
    
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error('❌ FALHA CRÍTICA AO INICIAR O SERVIDOR ❌');
    console.error(error);
    process.exit(1);
  }
}

startServer();