require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const knex = require('./config/database');

// Importa os arquivos de rota
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes'); // <-- IMPORTAR A NOVA ROTA

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Configuração do CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Rota leve para monitoramento de atividade (keep-alive)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is alive',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// --- REGISTRO DAS ROTAS ---

// Rotas de Autenticação (PÚBLICAS)
app.use('/api/auth', authRoutes);

// Rotas do Dashboard (PÚBLICAS) <-- REGISTRAR A NOVA ROTA AQUI
app.use('/api/public', publicRoutes);

// Rotas de Administração (PROTEGIDAS)
app.use('/api/admin', authMiddleware, adminRoutes);

// Middleware de erro deve ser o último
app.use(errorMiddleware);

module.exports = app;
