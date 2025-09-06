// Arquivo: backend/src/app.js (Corrigido com configuração de CORS explícita)

require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const knex = require('./config/database');

// Importa os arquivos de rota
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// --- CORREÇÃO DE CORS APLICADA AQUI ---
// Configuração explícita do CORS para permitir todos os métodos e origens
// durante o desenvolvimento. Isso garante que as requisições preflight (OPTIONS)
// sejam tratadas corretamente.
app.use(cors({
  origin: '*', // Em produção, restrinja para o domínio do seu frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
// --- FIM DA CORREÇÃO ---

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// Rotas de Autenticação (PÚBLICAS)
app.use('/api/auth', authRoutes);

// Rotas de Administração (PROTEGIDAS)
app.use('/api/admin', authMiddleware, adminRoutes);

app.use(errorMiddleware);

module.exports = app;
