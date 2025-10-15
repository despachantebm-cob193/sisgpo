require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const knex = require('./config/database');
const path = require('path'); // Importa o módulo 'path'

// Importa os arquivos de rota
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const externalRoutes = require('./routes/externalRoutes'); 

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use('/api/external', externalRoutes);

// DEFINE O CAMINHO CORRETO DA PASTA DE BUILD DO FRONTEND
// Caminho absoluto para: .../sisgpo-e51d44be7dd9fc159c9ca447544b40224c715148/sisgpo-frontend/dist
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
  // Nesta rota, se o sistema estiver em produção, você pode querer redirecionar para o frontend.
  // Por agora, manteremos a resposta JSON da API.
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// --- REGISTRO DAS ROTAS DA API (DEVE SER FEITO ANTES DO SERVIÇO DE ARQUIVOS ESTÁTICOS) ---

// Rotas de Autenticação (PÚBLICAS)
app.use('/api/auth', authRoutes);

// Rotas do Dashboard (PÚBLICAS)
app.use('/api/public', publicRoutes);

// Rotas de Administração (PROTEGIDAS)
app.use('/api/admin', authMiddleware, adminRoutes);

// ------------------------------------------------------------------------------------------
// --- SERVINDO O FRONTEND (SPA HISTORY FALLBACK) ---
// ESSA SEÇÃO DEVE ESTAR DEPOIS DE TODAS AS ROTAS DA API (/api/*)
// ------------------------------------------------------------------------------------------

// 1. Serve os arquivos estáticos (CSS, JS, imagens)
app.use(express.static(frontendPath));

// 2. Rota Catch-All para o SPA (fallback)
// Qualquer rota que não seja /health, / ou /api/* será redirecionada para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Middleware de erro deve ser o último
app.use(errorMiddleware);

module.exports = app;