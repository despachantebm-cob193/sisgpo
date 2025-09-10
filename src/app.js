// Arquivo: backend/src/app.js (VERSÃO CORRIGIDA COM CORS)

require('dotenv').config();
const express = require('express');
require('express-async-errors');
const cors = require('cors'); // Importa o pacote cors
const knex = require('./config/database');

// Importa os arquivos de rota
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Importa os middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// --- CORREÇÃO DE CORS APLICADA AQUI ---
// Configuração explícita do CORS para permitir todas as origens, métodos e
// cabeçalhos durante o desenvolvimento. Isso é crucial para que o Playwright (rodando em uma origem)
// consiga fazer requisições para a API (rodando em outra).
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

// Middleware de erro deve ser o último
app.use(errorMiddleware);

module.exports = app;
