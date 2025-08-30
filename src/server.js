// src/server.js
const app = require('./app');

// Pega a porta do arquivo .env ou usa 3333 como padrão
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
