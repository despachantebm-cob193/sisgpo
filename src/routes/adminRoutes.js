const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadConfig = require('../config/upload');

// --- Middlewares ---
const validationMiddleware = require('../middlewares/validationMiddleware');

// --- Validadores ---
const { createMilitarSchema, updateMilitarSchema } = require('../validators/militarValidator');
const { createObmSchema, updateObmSchema } = require('../validators/obmValidator');
const { createViaturaSchema, updateViaturaSchema } = require('../validators/viaturaValidator');
const { plantaoSchema } = require('../validators/plantaoValidator');
const { createEscalaSchema, updateEscalaSchema } = require('../validators/escalaMedicoValidator');
const { changePasswordSchema } = require('../validators/userValidator');
const { createEscalaAeronaveSchema } = require('../validators/escalaAeronaveValidator');
const { createEscalaCodecSchema } = require('../validators/escalaCodecValidator');

// --- Controladores ---
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const escalaMedicoController = require('../controllers/escalaMedicoController');
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const viaturaFileController = require('../controllers/viaturaFileController');
const obmFileController = require('../controllers/obmFileController');
const militarFileController = require('../controllers/militarFileController');
const servicoDiaController = require('../controllers/servicoDiaController');
const escalaAeronaveController = require('../controllers/escalaAeronaveController');
const escalaCodecController = require('../controllers/escalaCodecController');

// --- Instância do Multer para Upload ---
const upload = multer(uploadConfig);

// --- ROTAS DE DASHBOARD (PROTEGIDAS) ---
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/viatura-stats-por-tipo', dashboardController.getViaturaStatsPorTipo);
router.get('/dashboard/militar-stats', dashboardController.getMilitarStats);
router.get('/dashboard/viatura-stats-detalhado', dashboardController.getViaturaStatsDetalhado);
router.get('/dashboard/viatura-stats-por-obm', dashboardController.getViaturaStatsPorObm);
router.get('/dashboard/servico-dia', dashboardController.getServicoDia);
// --- CORREÇÃO APLICADA AQUI: Adicionando as rotas que faltavam ---
router.get('/dashboard/escala-aeronaves', dashboardController.getEscalaAeronaves);
router.get('/dashboard/escala-codec', dashboardController.getEscalaCodec);
// --- FIM DA CORREÇÃO ---

// --- ROTAS DE METADADOS ---
router.get('/metadata/:key', dashboardController.getMetadataByKey);

// --- ROTAS DE OBMs ---
router.get('/obms', obmController.getAll);
router.get('/obms/search', obmController.search);
router.post('/obms', validationMiddleware(createObmSchema), obmController.create);
router.put('/obms/:id', validationMiddleware(updateObmSchema), obmController.update);
router.delete('/obms/:id', obmController.delete);
router.post('/obms/upload-csv', upload.single('file'), obmFileController.upload);

// --- ROTAS DE VIATURAS ---
router.get('/viaturas', viaturaController.getAll);
router.get('/viaturas/simple', viaturaController.getAllSimple);
router.get('/viaturas/aeronaves', viaturaController.getAeronaves);
router.get('/viaturas/distinct-obms', viaturaController.getDistinctObms);
router.post('/viaturas', validationMiddleware(createViaturaSchema), viaturaController.create);
router.put('/viaturas/:id', validationMiddleware(updateViaturaSchema), viaturaController.update);
router.delete('/viaturas/:id', viaturaController.delete);
router.delete('/viaturas/clear-all', viaturaController.clearAll);
router.post('/viaturas/upload-csv', upload.single('file'), viaturaFileController.upload);

// --- ROTAS DE MILITARES ---
router.get('/militares', militarController.getAll);
router.get('/militares/search', militarController.search);
router.get('/militares/:matricula', militarController.getByMatricula);
router.post('/militares', validationMiddleware(createMilitarSchema), militarController.create);
router.put('/militares/:id', validationMiddleware(updateMilitarSchema), militarController.update);
router.delete('/militares/:id', militarController.delete);
router.post('/militares/upload', upload.single('file'), militarFileController.upload);

// --- ROTAS DE PLANTÕES (VIATURAS) ---
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.post('/plantoes', validationMiddleware(plantaoSchema), plantaoController.create);
router.put('/plantoes/:id', validationMiddleware(plantaoSchema), plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);

// --- ROTAS DE CIVIS (CADASTRO DE MÉDICOS) ---
router.get('/civis', escalaMedicoController.getAllCivis);
router.get('/civis/search', escalaMedicoController.searchCivis);
router.post('/civis', escalaMedicoController.createCivil);
router.put('/civis/:id', escalaMedicoController.updateCivil);
router.delete('/civis/:id', escalaMedicoController.deleteCivil);

// --- ROTAS DE ESCALA DE MÉDICOS ---
router.get('/escala-medicos', escalaMedicoController.getAllEscalas);
router.post('/escala-medicos', validationMiddleware(createEscalaSchema), escalaMedicoController.createEscala);
router.delete('/escala-medicos/:id', escalaMedicoController.deleteEscala);

// --- ROTAS DE ESCALA DE AERONAVES (AÇÕES DE MODIFICAÇÃO) ---
router.get('/escala-aeronaves', escalaAeronaveController.getAll);
router.post('/escala-aeronaves', validationMiddleware(createEscalaAeronaveSchema), escalaAeronaveController.create);
router.delete('/escala-aeronaves/:id', escalaAeronaveController.delete);

// --- ROTAS DE ESCALA DO CODEC (AÇÕES DE MODIFICAÇÃO) ---
router.get('/escala-codec', escalaCodecController.getAll);
router.post('/escala-codec', validationMiddleware(createEscalaCodecSchema), escalaCodecController.create);
router.delete('/escala-codec/:id', escalaCodecController.delete);

// --- ROTAS DE SERVIÇO DE DIA ---
router.get('/servico-dia', servicoDiaController.getByDate);
router.post('/servico-dia', servicoDiaController.save);

// --- ROTAS DE USUÁRIO ---
router.put('/user/change-password', validationMiddleware(changePasswordSchema), userController.changePassword);

module.exports = router;
