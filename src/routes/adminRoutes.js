// Arquivo: backend/src/routes/adminRoutes.js (Completo e Corrigido)

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuração do Multer
const upload = multer({ dest: 'uploads/' });

// --- Controllers ---
const militarController = require('../controllers/militarController');
const escalaController = require('../controllers/escalaController'); 
const obmController = require('../controllers/obmController');
const obmFileController = require('../controllers/obmFileController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const dashboardController = require('../controllers/dashboardController');
const viaturaFileController = require('../controllers/viaturaFileController');
const userController = require('../controllers/userController');
const servicoDiaController = require('../controllers/servicoDiaController');

// --- Validadores ---
const validationMiddleware = require('../middlewares/validationMiddleware');
const { createMilitarSchema, updateMilitarSchema } = require('../validators/militarValidator');
const { createEscalaSchema, updateEscalaSchema } = require('../validators/escalaValidator'); 
const { createObmSchema, updateObmSchema } = require('../validators/obmValidator');
const { createViaturaSchema, updateViaturaSchema } = require('../validators/viaturaValidator');
const { plantaoSchema } = require('../validators/plantaoValidator');
const { changePasswordSchema } = require('../validators/userValidator');

// --- ROTAS DE DASHBOARD ---
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/viatura-stats-por-tipo', dashboardController.getViaturaStatsPorTipo);
router.get('/dashboard/militar-stats', dashboardController.getMilitarStats);
router.get('/dashboard/viatura-stats-detalhado', dashboardController.getViaturaStatsDetalhado);
router.get('/dashboard/viatura-stats-por-obm', dashboardController.getViaturaStatsPorObm);

// --- ROTAS DE OBMS ---
router.get('/obms', obmController.getAll);
router.get('/obms/search', obmController.search);
router.post('/obms', validationMiddleware(createObmSchema), obmController.create);
router.put('/obms/:id', validationMiddleware(updateObmSchema), obmController.update);
router.delete('/obms/:id', obmController.delete);
router.post('/obms/upload', upload.single('file'), obmFileController.upload);

// --- ROTAS DE MILITARES ---
router.get('/militares', militarController.getAll);
router.post('/militares', validationMiddleware(createMilitarSchema), militarController.create);
router.put('/militares/:id', validationMiddleware(updateMilitarSchema), militarController.update);
router.delete('/militares/:id', militarController.delete);

// --- ROTAS DE ESCALA (ANTIGA CIVIS) ---
router.get('/civis', escalaController.getAll);
router.post('/civis', validationMiddleware(createEscalaSchema), escalaController.create);
router.put('/civis/:id', validationMiddleware(updateEscalaSchema), escalaController.update);
router.delete('/civis/:id', escalaController.delete);

// --- ROTAS DE VIATURAS (COM A ORDEM CORRIGIDA) ---
router.get('/viaturas', viaturaController.getAll);
router.get('/viaturas/distinct-obms', viaturaController.getDistinctObms);
router.post('/viaturas', validationMiddleware(createViaturaSchema), viaturaController.create);
router.post('/viaturas/upload-csv', upload.single('file'), viaturaFileController.upload);

// **CORREÇÃO APLICADA AQUI:** A rota mais específica vem ANTES da rota com parâmetro dinâmico.
router.delete('/viaturas/clear-all', viaturaController.clearAll); // Rota para limpar a tabela
router.delete('/viaturas/:id', viaturaController.delete); // Rota para deletar uma viatura específica
router.put('/viaturas/:id', validationMiddleware(updateViaturaSchema), viaturaController.update);


// --- ROTAS DE PLANTÕES ---
router.post('/plantoes', validationMiddleware(plantaoSchema), plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', validationMiddleware(plantaoSchema), plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

// --- ROTAS DE SERVIÇO DO DIA ---
router.get('/servico-dia', servicoDiaController.getByDate);
router.post('/servico-dia', servicoDiaController.save);

// --- ROTAS DE USUÁRIO ---
router.put(
  '/user/change-password',
  validationMiddleware(changePasswordSchema),
  userController.changePassword
);

// --- ROTA DE METADADOS ---
router.get('/metadata/:key', dashboardController.getMetadataByKey);

module.exports = router;
