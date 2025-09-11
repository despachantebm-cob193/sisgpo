// Arquivo: backend/src/routes/adminRoutes.js (VERSÃO ATUALIZADA)

const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// --- Controllers ---
const militarController = require('../controllers/militarController');
const militarFileController = require('../controllers/militarFileController');
const escalaController = require('../controllers/escalaController'); 
const obmController = require('../controllers/obmController');
const obmFileController = require('../controllers/obmFileController');
const viaturaController = require('../controllers/viaturaController');
const viaturaFileController = require('../controllers/viaturaFileController');
const plantaoController = require('../controllers/plantaoController');
const dashboardController = require('../controllers/dashboardController');
const userController = require('../controllers/userController');
const servicoDiaController = require('../controllers/servicoDiaController');

// --- Validadores (vamos reutilizar os de escala por enquanto) ---
const { createEscalaSchema, updateEscalaSchema } = require('../validators/escalaValidator');
// ... outros validadores

// --- ROTAS DE CADASTRO DE MÉDICOS (tabela 'civis') ---
router.get('/civis', escalaController.getAllCivis);
router.post('/civis', escalaController.createCivil); // Usaremos um novo validador depois
router.put('/civis/:id', escalaController.updateCivil); // Usaremos um novo validador depois
router.delete('/civis/:id', escalaController.deleteCivil);
router.get('/civis/search', escalaController.searchCivis);

// --- ROTAS DE ESCALA DE MÉDICOS (tabela 'escala_medicos') ---
router.get('/escala-medicos', escalaController.getAllEscalas);
router.post('/escala-medicos', escalaController.createEscala); // Validador existente ainda serve
router.delete('/escala-medicos/:id', escalaController.deleteEscala);

// ... (Restante das rotas de OBMs, Militares, Viaturas, etc., permanecem iguais)
// --- ROTAS DE DASHBOARD ---
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/viatura-stats-por-tipo', dashboardController.getViaturaStatsPorTipo);
router.get('/dashboard/militar-stats', dashboardController.getMilitarStats);
router.get('/dashboard/viatura-stats-detalhado', dashboardController.getViaturaStatsDetalhado);
router.get('/dashboard/viatura-stats-por-obm', dashboardController.getViaturaStatsPorObm);
router.get('/dashboard/servico-dia', dashboardController.getServicoDia);

// --- ROTAS DE OBMS ---
router.get('/obms', obmController.getAll);
router.get('/obms/search', obmController.search);
router.post('/obms', obmController.create);
router.put('/obms/:id', obmController.update);
router.delete('/obms/:id', obmController.delete);
router.post('/obms/upload', upload.single('file'), obmFileController.upload);

// --- ROTAS DE MILITARES ---
router.get('/militares', militarController.getAll);
router.get('/militares/search', militarController.search);
router.get('/militares/matricula/:matricula', militarController.getByMatricula);
router.post('/militares', militarController.create);
router.put('/militares/:id', militarController.update);
router.delete('/militares/:id', militarController.delete);
router.post('/militares/upload', upload.single('file'), militarFileController.upload);

// --- ROTAS DE VIATURAS ---
router.get('/viaturas', viaturaController.getAll);
router.get('/viaturas/distinct-obms', viaturaController.getDistinctObms);
router.post('/viaturas', viaturaController.create);
router.post('/viaturas/upload-csv', upload.single('file'), viaturaFileController.upload);
router.delete('/viaturas/clear-all', viaturaController.clearAll);
router.delete('/viaturas/:id', viaturaController.delete);
router.put('/viaturas/:id', viaturaController.update);

// --- ROTAS DE PLANTÕES ---
router.post('/plantoes', plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

// --- ROTAS DE SERVIÇO DO DIA ---
router.get('/servico-dia', servicoDiaController.getByDate);
router.post('/servico-dia', servicoDiaController.save);

// --- ROTAS DE USUÁRIO ---
router.put('/user/change-password', userController.changePassword);

// --- ROTA DE METADADOS ---
router.get('/metadata/:key', dashboardController.getMetadataByKey);


module.exports = router;
