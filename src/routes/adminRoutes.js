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

// Middleware para upload de arquivos
router.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  responseOnLimit: 'O arquivo é muito grande (limite de 5MB).',
}));

// --- ROTAS DE UPLOAD DE ARQUIVOS ---
router.post('/militares/upload-csv', ensureAdmin, militarFileController.upload);
router.post('/viaturas/upload-validate', ensureAdmin, viaturaFileController.validateUpload);
router.post('/viaturas/upload-csv', ensureAdmin, viaturaFileController.upload);  
router.post('/obms/upload-csv', ensureAdmin, obmController.uploadCsv);
// --- FIM DA CORREÇÃO ---


// --- ROTAS CRUD (OBMs) ---\
router.get('/obms/all', obmController.getAllSimple);
router.get('/obms', obmController.getAll);
router.get('/obms/search', obmController.search);
router.post('/obms', ensureAdmin, validate(obmValidator.create), obmController.create);
router.put('/obms/:id', ensureAdmin, validate(obmValidator.update), obmController.update);
router.delete('/obms/:id', ensureAdmin, obmController.delete);
router.delete('/obms', ensureAdmin, obmController.clearAll);

// --- ROTAS CRUD (Viaturas) ---
router.get('/viaturas/duplicates/count', viaturaController.countByObm);
router.get('/viaturas/simple', viaturaController.getAllSimple);
router.get('/viaturas', viaturaController.getAll);
router.get('/viaturas/search', viaturaController.search);
router.get('/viaturas/distinct-obms', viaturaController.getDistinctObms);
router.post('/viaturas', ensureAdmin, validate(viaturaValidator.create), viaturaController.create);
router.put('/viaturas/:id', ensureAdmin, validate(viaturaValidator.update), viaturaController.update);

// --- INÍCIO DA CORREÇÃO ---
// A Rota Específica (clear-all) DEVE vir ANTES da Rota Genérica (:id)
router.delete('/viaturas/clear-all', ensureAdmin, viaturaController.clearAll); 
// --- FIM DA CORREÇÃO ---

router.delete('/viaturas/:id', ensureAdmin, viaturaController.delete);
router.post('/viaturas/:id/toggle-active', ensureAdmin, viaturaController.toggleActive);
router.get('/viaturas/clear-all/preview', ensureAdmin, viaturaController.previewClearAll);

// --- ROTAS CRUD (Militares) ---
router.get('/militares', militarController.getAll);
router.get('/militares/search', militarController.search);
router.post('/militares', ensureAdmin, validate(militarValidator.create), militarController.create);
router.put('/militares/:id', ensureAdmin, validate(militarValidator.update), militarController.update);
router.delete('/militares/:id', ensureAdmin, militarController.delete);
router.post('/militares/:id/toggle-active', ensureAdmin, militarController.toggleActive);

// --- ROTAS CRUD (Medicos - Antigos Civis) ---
router.get('/medicos', medicoController.getAll);
router.get('/medicos/search', medicoController.search);
router.post('/medicos', ensureAdmin, medicoController.create);
router.put('/medicos/:id', ensureAdmin, medicoController.update);
router.delete('/medicos/:id', ensureAdmin, medicoController.delete);
router.post('/medicos/:id/toggle-active', ensureAdmin, medicoController.toggleActive);

// --- ROTAS LEGADAS PARA CIVIS (SUPORTE AOS FORMULÁRIOS ANTIGOS) ---
router.get('/civis/search', escalaMedicoController.searchCivis);

// --- ROTAS CRUD (Aeronaves) ---
router.get('/aeronaves', aeronaveController.getAll);
router.post('/aeronaves', ensureAdmin, validate(aeronaveValidator.create), aeronaveController.create);
router.put('/aeronaves/:id', ensureAdmin, validate(aeronaveValidator.update), aeronaveController.update);
router.delete('/aeronaves/:id', ensureAdmin, aeronaveController.delete);

// --- ROTAS CRUD (Usuários) ---
router.get('/users', userController.getAll);
router.get('/users/pending', userController.getPending);
router.post('/users/:id/approve', ensureAdmin, userController.approve);
router.post('/users/:id/reject', ensureAdmin, userController.reject);
router.post('/users', ensureAdmin, validate(userValidator.create), userController.create);
router.put('/users/:id', ensureAdmin, validate(userValidator.update), userController.update);
router.delete('/users/:id', ensureAdmin, userController.delete);
router.post('/users/:id/toggle-active', ensureAdmin, userController.toggleActive);
// Rota de troca de senha para o usuario autenticado (compatibilidade com frontend /perfil)
router.put('/user/change-password', userController.changePassword);

// --- ROTAS CRUD (Plantões) ---
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.post('/plantoes', ensureAdmin, plantaoController.create);
router.put('/plantoes/:id', ensureAdmin, plantaoController.update);
router.delete('/plantoes/:id', ensureAdmin, plantaoController.delete);
router.post('/plantoes/:id/add-viatura', ensureAdmin, plantaoController.addViatura);
router.delete('/plantoes/:plantaoId/remove-viatura/:viaturaId', ensureAdmin, plantaoController.removeViatura);
router.post('/plantoes/:id/add-militar', ensureAdmin, plantaoController.addMilitar);
router.delete('/plantoes/:plantaoId/remove-militar/:militarId', ensureAdmin, plantaoController.removeMilitar);
router.get('/plantoes/total-militares', plantaoController.getTotalMilitaresPlantao);

// --- ROTAS CRUD (Escala Aeronaves) ---
router.get('/escala-aeronaves', escalaAeronaveController.getAll);
router.get('/escala-aeronaves/:id', escalaAeronaveController.getById);
router.post('/escala-aeronaves', ensureAdmin, validate(escalaAeronaveValidator.create), escalaAeronaveController.create);
router.put('/escala-aeronaves/:id', ensureAdmin, validate(escalaAeronaveValidator.update), escalaAeronaveController.update);
router.delete('/escala-aeronaves/:id', ensureAdmin, escalaAeronaveController.delete);

// --- ROTAS CRUD (Escala CODEC) ---
router.get('/escala-codec', escalaCodecController.getAll);
router.get('/escala-codec/:id', escalaCodecController.getById);
router.post('/escala-codec', ensureAdmin, validate(escalaCodecValidator.create), escalaCodecController.create);
router.put('/escala-codec/:id', ensureAdmin, validate(escalaCodecValidator.update), escalaCodecController.update);
router.delete('/escala-codec/:id', ensureAdmin, escalaCodecController.delete);

// --- ROTAS CRUD (Escala Médicos) ---
router.get('/escala-medicos', escalaMedicoController.getAll);
router.get('/escala-medicos/:id', escalaMedicoController.getById);
router.post('/escala-medicos', ensureAdmin, validate(escalaMedicoValidator.create), escalaMedicoController.create);
router.put('/escala-medicos/:id', ensureAdmin, validate(escalaMedicoValidator.update), escalaMedicoController.update);
router.delete('/escala-medicos/:id', ensureAdmin, escalaMedicoController.delete);




// --- ROTAS LEGADAS (Mantidas por enquanto) ---
router.get('/escala', escalaController.getEscala);
router.put('/escala', ensureAdmin, escalaController.updateEscala);

router.get('/servico-dia', servicoDiaController.getServicoDia);
router.post('/servico-dia', ensureAdmin, servicoDiaController.updateServicoDia); // Corrigido de PUT para POST
router.delete('/servico-dia', ensureAdmin, servicoDiaController.deleteServicoDia); // Adicionado


// --- ROTA DE RELATÓRIO ---
router.get('/relatorio/diario', relatorioController.getRelatorioDiario);
router.get('/relatorio-diario', relatorioController.getRelatorioDiario);
router.get('/metadata/:key', dashboardController.getMetadataByKey);

module.exports = router;
