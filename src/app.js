require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./config/database');

const adminRoutes = require('./routes/adminRoutes'); // Importa as rotas

const app = express();

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// Usa as rotas administrativas com o prefixo /api/admin
app.use('/api/admin', adminRoutes);

module.exports = app;
