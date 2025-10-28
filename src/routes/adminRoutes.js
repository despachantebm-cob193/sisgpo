// Arquivo: src/routes/adminRoutes.js (VERSÃO CORRIGIDA)

const { Router } = require('express');
const { validate } = require('express-validation');
const fileUpload = require('express-fileupload');

// Middlewares
const ensureAdmin = require('../middlewares/ensureAdmin');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Validadores
const obmValidator = require('../validators/obmValidator');
const viaturaValidator = require('../validators/viaturaValidator');
const militarValidator = require('../validators/militarValidator');
const userValidator = require('../validators/userValidator');
const escalaValidator = require('../validators/escalaValidator');
const aeronaveValidator = require('../validators/aeronaveValidator');
const escalaAeronaveValidator = require('../validators/escalaAeronaveValidator');
const escalaCodecValidator = require('../validators/escalaCodecValidator');
const escalaMedicoValidator = require('../validators/escalaMedicoValidator');

// Controladores
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const militarController = require('../controllers/militarController');
const userController = require('../controllers/userController');
const plantaoController = require('../controllers/plantaoController');
const relatorioController = require('../controllers/relatorioController');
const escalaController = require('../controllers/escalaController');
const servicoDiaController = require('../controllers/servicoDiaController');
const medicoController = require('../controllers/medicoController');
const aeronaveController = require('../controllers/aeronaveController');
const escalaAeronaveController = require('../controllers/escalaAeronaveController');
const escalaCodecController = require('../controllers/escalaCodecController');
const escalaMedicoController = require('../controllers/escalaMedicoController');
const dashboardController = require('../controllers/dashboardController');

// Controladores de Upload (Legados ou específicos)
const viaturaFileController = require('../controllers/viaturaFileController');
const militarFileController = require('../controllers/militarFileController');
const obmFileController = require('../controllers/obmFileController'); 

const router = Router();

// Middleware para garantir que apenas Admins acessem estas rotas
router.use(ensureAdmin);

// Middleware para upload de arquivos
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  responseOnLimit: 'O arquivo é muito grande (limite de 5MB).',
}));

// --- ROTAS DE UPLOAD DE ARQUIVOS ---
router.post('/militares/upload-csv', militarFileController.upload);
router.post('/viaturas/upload-csv', viaturaFileController.upload);  
router.post('/obms/upload-csv', obmController.uploadCsv);
// --- FIM DA CORREÇÃO ---


// --- ROTAS CRUD (OBMs) ---\
router.get('/obms', obmController.getAll);
router.get('/obms/search', obmController.search);
router.post('/obms', validate(obmValidator.create), obmController.create);
router.put('/obms/:id', validate(obmValidator.update), obmController.update);
router.delete('/obms/:id', obmController.delete);
router.delete('/obms', obmController.clearAll);

// --- ROTAS CRUD (Viaturas) ---
router.get('/viaturas/duplicates/count', viaturaController.countByObm);
router.get('/viaturas/simple', viaturaController.getAllSimple);
router.get('/viaturas', viaturaController.getAll);
router.get('/viaturas/search', viaturaController.search);
router.get('/viaturas/distinct-obms', viaturaController.getDistinctObms);
router.post('/viaturas', validate(viaturaValidator.create), viaturaController.create);
router.put('/viaturas/:id', validate(viaturaValidator.update), viaturaController.update);

// --- INÍCIO DA CORREÇÃO ---
// A Rota Específica (clear-all) DEVE vir ANTES da Rota Genérica (:id)
router.delete('/viaturas/clear-all', viaturaController.clearAll); 
// --- FIM DA CORREÇÃO ---

router.delete('/viaturas/:id', viaturaController.delete);
router.post('/viaturas/:id/toggle-active', viaturaController.toggleActive);

// --- ROTAS CRUD (Militares) ---
router.get('/militares', militarController.getAll);
router.get('/militares/search', militarController.search);
router.post('/militares', validate(militarValidator.create), militarController.create);
router.put('/militares/:id', validate(militarValidator.update), militarController.update);
router.delete('/militares/:id', militarController.delete);
router.post('/militares/:id/toggle-active', militarController.toggleActive);

// --- ROTAS CRUD (Medicos - Antigos Civis) ---
router.get('/medicos', medicoController.getAll);
router.get('/medicos/search', medicoController.search);
router.post('/medicos', medicoController.create);
router.put('/medicos/:id', medicoController.update);
router.delete('/medicos/:id', medicoController.delete);
router.post('/medicos/:id/toggle-active', medicoController.toggleActive);

// --- ROTAS LEGADAS PARA CIVIS (SUPORTE AOS FORMULÁRIOS ANTIGOS) ---
router.get('/civis/search', escalaMedicoController.searchCivis);

// --- ROTAS CRUD (Aeronaves) ---
router.get('/aeronaves', aeronaveController.getAll);
router.post('/aeronaves', validate(aeronaveValidator.create), aeronaveController.create);
router.put('/aeronaves/:id', validate(aeronaveValidator.update), aeronaveController.update);
router.delete('/aeronaves/:id', aeronaveController.delete);

// --- ROTAS CRUD (Usuários) ---
router.get('/users', userController.getAll);
router.post('/users', validate(userValidator.create), userController.create);
router.put('/users/:id', validate(userValidator.update), userController.update);
router.delete('/users/:id', userController.delete);
router.post('/users/:id/toggle-active', userController.toggleActive);

// --- ROTAS CRUD (Plantões) ---
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.post('/plantoes', plantaoController.create);
router.put('/plantoes/:id', plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);
router.post('/plantoes/:id/add-viatura', plantaoController.addViatura);
router.delete('/plantoes/:plantaoId/remove-viatura/:viaturaId', plantaoController.removeViatura);
router.post('/plantoes/:id/add-militar', plantaoController.addMilitar);
router.delete('/plantoes/:plantaoId/remove-militar/:militarId', plantaoController.removeMilitar);

// --- ROTAS CRUD (Escala Aeronaves) ---
router.get('/escala-aeronaves', escalaAeronaveController.getAll);
router.get('/escala-aeronaves/:id', escalaAeronaveController.getById);
router.post('/escala-aeronaves', validate(escalaAeronaveValidator.create), escalaAeronaveController.create);
router.put('/escala-aeronaves/:id', validate(escalaAeronaveValidator.update), escalaAeronaveController.update);
router.delete('/escala-aeronaves/:id', escalaAeronaveController.delete);

// --- ROTAS CRUD (Escala CODEC) ---
router.get('/escala-codec', escalaCodecController.getAll);
router.get('/escala-codec/:id', escalaCodecController.getById);
router.post('/escala-codec', validate(escalaCodecValidator.create), escalaCodecController.create);
router.put('/escala-codec/:id', validate(escalaCodecValidator.update), escalaCodecController.update);
router.delete('/escala-codec/:id', escalaCodecController.delete);

// --- ROTAS CRUD (Escala Médicos) ---
router.get('/escala-medicos', escalaMedicoController.getAll);
router.get('/escala-medicos/:id', escalaMedicoController.getById);
router.post('/escala-medicos', validate(escalaMedicoValidator.create), escalaMedicoController.create);
router.put('/escala-medicos/:id', validate(escalaMedicoValidator.update), escalaMedicoController.update);
router.delete('/escala-medicos/:id', escalaMedicoController.delete);




// --- ROTAS LEGADAS (Mantidas por enquanto) ---
router.get('/escala', escalaController.getEscala);
router.put('/escala', escalaController.updateEscala);

router.get('/servico-dia', servicoDiaController.getServicoDia);
router.post('/servico-dia', servicoDiaController.updateServicoDia); // Corrigido de PUT para POST
router.delete('/servico-dia', servicoDiaController.deleteServicoDia); // Adicionado


// --- ROTA DE RELATÓRIO ---
router.get('/relatorio/diario', relatorioController.getRelatorioDiario);

module.exports = router;
