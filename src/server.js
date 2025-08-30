// src/server.js
const app = require('./app');
const bootstrapDatabase = require('./bootstrap'); // 1. Importa a função

const PORT = process.env.PORT || 3333;

// 2. Cria uma função assíncrona para iniciar o servidor
const startServer = async () => {
  // 3. Executa o bootstrap ANTES de iniciar o servidor
  await bootstrapDatabase();

  // 4. Inicia o servidor Express normalmente
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
};

// 5. Chama a função para iniciar tudo
startServer();
