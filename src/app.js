require('dotenv').config();
const express = require('express');
require('express-async-errors'); // 1. Importar para tratamento de erros assíncronos
const cors = require('cors');
require('./config/database');

const adminRoutes = require('./routes/adminRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware'); // 2. Importar nosso middleware

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

app.use('/api/admin', adminRoutes);

// 3. Usar o middleware de erro. DEVE ser o último middleware.
app.use(errorMiddleware);

module.exports = app;
