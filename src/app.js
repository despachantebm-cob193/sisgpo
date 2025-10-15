require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const knex = require('./config/database');
const path = require('path');

// --- Importação das Rotas ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
// REMOVIDO: A rota externa antiga, que estava incorreta
// const externalRoutes = require('./routes/externalRoutes'); 
// ADICIONADO: A nova rota para buscar dados do sistema de ocorrências
const estatisticasExternasRoutes = require('./routes/estatisticasExternasRoutes'); 

// --- Importação dos Middlewares ---
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// DEFINE O CAMINHO CORRETO DA PASTA DE BUILD DO FRONTEND
const frontendPath = path.join(__dirname, '..', 'sisgpo-frontend', 'dist');


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

// --- REGISTRO DAS ROTAS DA API ---

// Rotas de Autenticação (PÚBLICAS)
app.use('/api/auth', authRoutes);

// Rotas do Dashboard (PÚBLICAS)
app.use('/api/public', publicRoutes);

// ADICIONADO: Nova rota para a integração, protegida pelo login do SISGPO
app.use('/api', estatisticasExternasRoutes);

// Rotas de Administração (PROTEGIDAS)
app.use('/api/admin', authMiddleware, adminRoutes);

// A linha abaixo foi removida pois a rota estava errada
// app.use('/api/external', externalRoutes);

// ------------------------------------------------------------------------------------------
// --- SERVINDO O FRONTEND (SPA HISTORY FALLBACK) ---
// ------------------------------------------------------------------------------------------

// 1. Serve os arquivos estáticos (CSS, JS, imagens)
app.use(express.static(frontendPath));

// 2. Rota Catch-All para o SPA (fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Middleware de erro deve ser o último
app.use(errorMiddleware);

module.exports = app;