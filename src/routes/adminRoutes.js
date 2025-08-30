// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

// 1. Importa os controllers e middlewares
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const dashboardController = require('../controllers/dashboardController');
// sheetsController foi removido

// 2. Importa os validadores
const validationMiddleware = require('../middlewares/validationMiddleware');
const { createMilitarSchema, updateMilitarSchema } = require('../validators/militarValidator');
const { createObmSchema, updateObmSchema } = require('../validators/obmValidator');
const { createViaturaSchema, updateViaturaSchema } = require('../validators/viaturaValidator');
const { plantaoSchema } = require('../validators/plantaoValidator');

// --- ROTA DE DASHBOARD ---
// Acessível em: GET /api/admin/dashboard/stats
router.get('/dashboard/stats', dashboardController.getStats);

// --- ROTAS DE OBMS ---
// Acessíveis em: /api/admin/obms
router.get('/obms', obmController.getAll);
router.post('/obms', validationMiddleware(createObmSchema), obmController.create);
router.put('/obms/:id', validationMiddleware(updateObmSchema), obmController.update);
router.delete('/obms/:id', obmController.delete);

// --- ROTAS DE MILITARES ---
// Acessíveis em: /api/admin/militares
router.get('/militares', militarController.getAll);
router.post('/militares', validationMiddleware(createMilitarSchema), militarController.create);
router.put('/militares/:id', validationMiddleware(updateMilitarSchema), militarController.update);
router.delete('/militares/:id', militarController.delete);

// --- ROTAS DE VIATURAS ---
// Acessíveis em: /api/admin/viaturas
router.get('/viaturas', viaturaController.getAll);
router.post('/viaturas', validationMiddleware(createViaturaSchema), viaturaController.create);
router.put('/viaturas/:id', validationMiddleware(updateViaturaSchema), viaturaController.update);
router.delete('/viaturas/:id', viaturaController.delete);

// --- ROTAS DE PLANTÕES ---
// Acessíveis em: /api/admin/plantoes
router.post('/plantoes', validationMiddleware(plantaoSchema), plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', validationMiddleware(plantaoSchema), plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

// --- ROTA DE SINCRONIZAÇÃO REMOVIDA ---

module.exports = router;
