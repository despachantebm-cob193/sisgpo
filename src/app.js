// src/app.js
require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const knex = require('./config/database'); // Importa a instância do Knex

// Importa os arquivos de rota
const adminRoutes = require('./routes/adminRoutes'); // Rotas protegidas

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Rota raiz para verificação de status
app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// ===================================================================
// REGISTRO DAS ROTAS
// ===================================================================

// Rotas de administração PROTEGIDAS
// O prefixo '/api/admin' é aplicado a todas as rotas definidas em adminRoutes.
// O middleware de autenticação também é aplicado aqui.
app.use('/api/admin', authMiddleware, adminRoutes);

// ===================================================================

// Middleware de erro (deve ser o último middleware registrado)
app.use(errorMiddleware);

module.exports = app;
