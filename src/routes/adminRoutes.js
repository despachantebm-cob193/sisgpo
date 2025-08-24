const express = require('express');
const router = express.Router();

// Importa o controller de autenticação
const authController = require('../controllers/authController');

// Define a rota de login
// POST /api/admin/login
router.post('/login', authController.login);

// (Futuramente, outras rotas protegidas virão aqui)

module.exports = router;
