require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const knex = require('./config/database');
const path = require('path'); // [SPA FIX] 1. Importa o módulo 'path'

// Importa os arquivos de rota
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// [SPA FIX] 2. Define o caminho para a pasta de build do frontend (assumindo 'sisgpo-frontend/dist')
// O caminho é resolvido a partir de 'src' (diretório atual) para a pasta 'dist' dentro de 'sisgpo-frontend'.
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

// Rotas de Administração (PROTEGIDAS)
app.use('/api/admin', authMiddleware, adminRoutes);

// --- SERVINDO O FRONTEND (SPA HISTORY FALLBACK) ---

// [SPA FIX] 3. Serve os arquivos estáticos da pasta de build do frontend.
app.use(express.static(frontendPath));

// [SPA FIX] 4. Rota catch-all: Para qualquer rota não tratada pelas APIs acima,
// envia o arquivo principal do frontend (index.html).
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Middleware de erro deve ser o último
app.use(errorMiddleware);

module.exports = app;