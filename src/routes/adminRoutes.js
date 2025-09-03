// Arquivo: src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuração do Multer para salvar arquivos temporariamente na pasta 'uploads'
const upload = multer({ dest: 'uploads/' });

// --- Importação de Controllers ---
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const dashboardController = require('../controllers/dashboardController');
const contatoController = require('../controllers/contatoController');
const viaturaFileController = require('../controllers/viaturaFileController');

// --- Importação de Validadores ---
const validationMiddleware = require('../middlewares/validationMiddleware');
const { createMilitarSchema, updateMilitarSchema } = require('../validators/militarValidator');
const { createObmSchema, updateObmSchema } = require('../validators/obmValidator'); 
const { createViaturaSchema, updateViaturaSchema } = require('../validators/viaturaValidator');
const { plantaoSchema } = require('../validators/plantaoValidator');

// --- ROTAS DE DASHBOARD ---
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/viatura-stats', dashboardController.getViaturaStats);
router.get('/dashboard/militar-stats', dashboardController.getMilitarStats);

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
router.post('/viaturas/upload-csv', upload.single('file'), viaturaFileController.upload);

// --- ROTAS DE PLANTÕES ---
router.post('/plantoes', validationMiddleware(plantaoSchema), plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', validationMiddleware(plantaoSchema), plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

// --- ROTAS DA LISTA TELEFÔNICA ---
router.get('/contatos', contatoController.getAll);
router.post('/contatos/upload', upload.single('file'), contatoController.upload);
router.get('/contatos/obms-unicas', contatoController.getObrasUnicas);

module.exports = router;
