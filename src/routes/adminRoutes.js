const express = require('express');
const router = express.Router();

// 1. Importa os controllers e middlewares
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const dashboardController = require('../controllers/dashboardController');
const sheetsController = require('../controllers/sheetsController');
const authMiddleware = require('../middlewares/authMiddleware');

// 2. Importa os validadores
const validationMiddleware = require('../validators/validationMiddleware');
const { createMilitarSchema, updateMilitarSchema } = require('../validators/militarValidator');
const { createObmSchema, updateObmSchema } = require('../validators/obmValidator');
const { createViaturaSchema, updateViaturaSchema } = require('../validators/viaturaValidator');
const { plantaoSchema } = require('../validators/plantaoValidator'); // Schema de plantão importado

// Rota pública de login
router.post('/login', authController.login);

// Aplica o middleware de autenticação para todas as rotas abaixo
router.use(authMiddleware);

// --- ROTA DE DASHBOARD ---
router.get('/dashboard/stats', dashboardController.getStats);

// --- ROTAS DE OBMS ---
router.get('/obms', obmController.getAll);
router.post('/obms', validationMiddleware(createObmSchema), obmController.create);
router.put('/obms/:id', validationMiddleware(updateObmSchema), obmController.update);
router.delete('/obms/:id', obmController.delete);

// --- ROTAS DE MILITARES ---
router.get('/militares', militarController.getAll);
router.post('/militares', validationMiddleware(createMilitarSchema), militarController.create);
router.put('/militares/:id', validationMiddleware(updateMilitarSchema), militarController.update);
router.delete('/militares/:id', militarController.delete);

// --- ROTAS DE VIATURAS ---
router.get('/viaturas', viaturaController.getAll);
router.post('/viaturas', validationMiddleware(createViaturaSchema), viaturaController.create);
router.put('/viaturas/:id', validationMiddleware(updateViaturaSchema), viaturaController.update);
router.delete('/viaturas/:id', viaturaController.delete);

// --- ROTAS DE PLANTÕES ---
router.post('/plantoes', validationMiddleware(plantaoSchema), plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', validationMiddleware(plantaoSchema), plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

// --- ROTA DE SINCRONIZAÇÃO COM GOOGLE SHEETS ---
router.post('/sheets/sync-militares', sheetsController.syncMilitares);

module.exports = router;
