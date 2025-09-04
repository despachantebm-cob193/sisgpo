// Arquivo: backend/src/server.js (Versão Otimizada para Deploy)

const app = require('./app');
const db = require('./config/database'); // Importe a instância do Knex
const bootstrapDatabase = require('./bootstrap'); // Importe a nova função de bootstrap

const PORT = process.env.PORT || 3333;

/**
 * Função principal para iniciar o servidor.
 * Ela garante que o banco de dados esteja pronto antes de a aplicação começar a rodar.
 */
async function startServer() {
  try {
    // 1. Roda as migrações do banco de dados para garantir que o schema esteja atualizado.
    console.log('[Server Start] Verificando e aplicando migrações do banco de dados...');
    await db.migrate.latest();
    console.log('[Server Start] Migrações concluídas com sucesso.');

    // 2. Roda a rotina de bootstrap para garantir dados essenciais (como o usuário admin).
    await bootstrapDatabase();

    // 3. Inicia o servidor Express para ouvir por requisições.
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error('❌ FALHA CRÍTICA AO INICIAR O SERVIDOR ❌');
    console.error(error);
    process.exit(1); // Encerra o processo se o banco de dados não puder ser preparado.
  }
}

// Inicia a execução
startServer();
