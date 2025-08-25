const express = require('express');
const router = express.Router();

// ... (importações de controllers e authMiddleware)
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Validadores
const validationMiddleware = require('../validators/validationMiddleware');
const { createMilitarSchema, updateMilitarSchema } = require('../validators/militarValidator');
const { createObmSchema, updateObmSchema } = require('../validators/obmValidator');
const { createViaturaSchema, updateViaturaSchema } = require('../validators/viaturaValidator');
// 1. Importa os novos schemas de Plantão
const { createPlantaoSchema, updatePlantaoSchema } = require('../validators/plantaoValidator');

// Rota pública
router.post('/login', authController.login);

// Middleware de autenticação
router.use(authMiddleware);

// Militares
router.get('/militares', militarController.getAll);
router.post('/militares', validationMiddleware(createMilitarSchema), militarController.create);
router.put('/militares/:id', validationMiddleware(updateMilitarSchema), militarController.update);
router.delete('/militares/:id', militarController.delete);

// OBMs
router.get('/obms', obmController.getAll);
router.post('/obms', validationMiddleware(createObmSchema), obmController.create);
router.put('/obms/:id', validationMiddleware(updateObmSchema), obmController.update);
router.delete('/obms/:id', obmController.delete);

// Viaturas
router.get('/viaturas', viaturaController.getAll);
router.post('/viaturas', validationMiddleware(createViaturaSchema), viaturaController.create);
router.put('/viaturas/:id', validationMiddleware(updateViaturaSchema), viaturaController.update);
router.delete('/viaturas/:id', viaturaController.delete);

// --- ROTAS DE PLANTÕES (AGORA COM VALIDAÇÃO) ---
// 2. Aplica o middleware de validação nas rotas de criação e atualização
router.post('/plantoes', validationMiddleware(createPlantaoSchema), plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', validationMiddleware(updatePlantaoSchema), plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

module.exports = router;
