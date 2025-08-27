require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
require('./config/database');

// Importa os arquivos de rota
const authRoutes = require('./routes/authRoutes'); // Rota pública
const adminRoutes = require('./routes/adminRoutes'); // Rotas protegidas

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// ===================================================================
// REGISTRO DAS ROTAS
// ===================================================================

// Rota de autenticação PÚBLICA, sem o middleware de autenticação
// Acessível em /api/admin/login
app.use('/api/admin', authRoutes);

// Rotas de administração PROTEGIDAS
// O middleware de autenticação é aplicado aqui, para todas as rotas em adminRoutes
app.use('/api/admin', authMiddleware, adminRoutes);

// ===================================================================

// Middleware de erro (deve ser o último)
app.use(errorMiddleware);

module.exports = app;
