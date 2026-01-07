import http from 'http';
import app from './app';
import bootstrapDatabase from './bootstrap';

const PORT = process.env.PORT || 3333;

async function startServer() {
  try {
    console.log('[Server Start] Iniciando servico SISGPO com Backend Supabase...');

    // Bootstrap agora usa Supabase Client
    await bootstrapDatabase();

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log('✅ Backend migrado para Supabase (Modo API/Client)');
    });

  } catch (error) {
    console.error('❌ FALHA AO INICIAR O SERVIDOR ❌');
    console.error(error);
    process.exit(1);
  }
}

startServer();