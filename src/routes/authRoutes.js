// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ssoAuthMiddleware } = require('../middlewares/ssoAuthMiddleware');

// Rota pública de login
// Será acessível via POST /api/auth/login
router.post('/login', authController.login);

// Rota para callback do Google SSO
router.post('/google/callback', authController.googleLogin);

// Rota para SSO vindo do sistema de ocorrências
router.post('/sso-login', ssoAuthMiddleware, authController.ssoLogin);


module.exports = router;
