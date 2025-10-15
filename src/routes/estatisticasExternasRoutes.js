// sisgpo/src/routes/estatisticasExternasRoutes.js

const { Router } = require('express');
const estatisticasExternasController = require('../controllers/estatisticasExternasController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticação do próprio sisgpo

const router = Router();

// A rota é protegida pelo login normal do sisgpo
router.get(
  '/dashboard-ocorrencias',
  authMiddleware, // Garante que apenas usuários logados no sisgpo possam acessar
  estatisticasExternasController.getDashboardOcorrencias
);

module.exports = router;