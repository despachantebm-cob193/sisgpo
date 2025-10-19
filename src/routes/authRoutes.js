// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota pública de login
// Será acessível via POST /api/auth/login
router.post('/login', authController.login);

// Rota para callback do Google SSO
router.post('/google/callback', authController.googleLogin);


module.exports = router;
