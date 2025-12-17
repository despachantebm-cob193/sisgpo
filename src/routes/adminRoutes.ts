import { Router } from 'express';
import { validate } from 'express-validation';
import fileUpload from 'express-fileupload';
import path from 'path';

const ensureAdmin = require(path.join(__dirname, '..', 'middlewares', 'ensureAdmin'));
const validationMiddleware = require(path.join(__dirname, '..', 'middlewares', 'validationMiddleware'));

const load = (relativePath: string) => {
  const mod = require(path.join(__dirname, relativePath));
  return mod?.default || mod;
};

const obmValidator = load('..\\validators\\obmValidator');
const viaturaValidator = load('..\\validators\\viaturaValidator');
const militarValidator = load('..\\validators\\militarValidator');
const userValidator = load('..\\validators\\userValidator');
const escalaValidator = load('..\\validators\\escalaValidator');
const aeronaveValidator = load('..\\validators\\aeronaveValidator');
const escalaAeronaveValidator = load('..\\validators\\escalaAeronaveValidator');
const escalaCodecValidator = load('..\\validators\\escalaCodecValidator');
const escalaMedicoValidator = load('..\\validators\\escalaMedicoValidator');

const obmController = require(path.join(__dirname, '..', 'controllers', 'obmController'));
const viaturaController = require(path.join(__dirname, '..', 'controllers', 'viaturaController'));
const militarController = require(path.join(__dirname, '..', 'controllers', 'militarController'));
const userController = require(path.join(__dirname, '..', 'controllers', 'userController'));
const plantaoController = require(path.join(__dirname, '..', 'controllers', 'plantaoController'));
const relatorioController = require(path.join(__dirname, '..', 'controllers', 'relatorioController'));
const escalaController = require(path.join(__dirname, '..', 'controllers', 'escalaController'));
const servicoDiaController = require(path.join(__dirname, '..', 'controllers', 'servicoDiaController'));
const medicoController = require(path.join(__dirname, '..', 'controllers', 'medicoController'));
const aeronaveController = require(path.join(__dirname, '..', 'controllers', 'aeronaveController'));
const escalaAeronaveController = require(path.join(__dirname, '..', 'controllers', 'escalaAeronaveController'));
const escalaCodecController = require(path.join(__dirname, '..', 'controllers', 'escalaCodecController'));
const escalaMedicoController = require(path.join(__dirname, '..', 'controllers', 'escalaMedicoController'));
const dashboardController = require(path.join(__dirname, '..', 'controllers', 'dashboardController'));

const viaturaFileController = require(path.join(__dirname, '..', 'controllers', 'viaturaFileController'));
const militarFileController = require(path.join(__dirname, '..', 'controllers', 'militarFileController'));
const obmFileController = require(path.join(__dirname, '..', 'controllers', 'obmFileController'));

const router = Router();

router.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: 'O arquivo é muito grande (limite de 5MB).',
  }),
);

router.post('/militares/upload-csv', ensureAdmin, militarFileController.upload);
router.post('/viaturas/upload-validate', ensureAdmin, viaturaFileController.validateUpload);
router.post('/viaturas/upload-csv', ensureAdmin, viaturaFileController.upload);
router.post('/obms/upload-csv', ensureAdmin, obmController.uploadCsv);

router.get('/obms/all', obmController.getAllSimple);
router.get('/obms', obmController.getAll);
router.get('/obms/search', obmController.search);
router.post('/obms', ensureAdmin, validate(obmValidator.create), obmController.create);
router.put('/obms/:id', ensureAdmin, validate(obmValidator.update), obmController.update);
router.delete('/obms/:id', ensureAdmin, obmController.delete);
router.delete('/obms', ensureAdmin, obmController.clearAll);

router.get('/viaturas/duplicates/count', viaturaController.countByObm);
router.get('/viaturas/simple', viaturaController.getAllSimple);
router.get('/viaturas', viaturaController.getAll);
router.get('/viaturas/search', viaturaController.search);
router.get('/viaturas/distinct-obms', viaturaController.getDistinctObms);
router.post('/viaturas', ensureAdmin, validate(viaturaValidator.create), viaturaController.create);
router.put('/viaturas/:id', ensureAdmin, validate(viaturaValidator.update), viaturaController.update);
router.delete('/viaturas/clear-all', ensureAdmin, viaturaController.clearAll);
router.delete('/viaturas/:id', ensureAdmin, viaturaController.delete);
router.post('/viaturas/:id/toggle-active', ensureAdmin, viaturaController.toggleActive);
router.get('/viaturas/clear-all/preview', ensureAdmin, viaturaController.previewClearAll);

router.get('/militares', militarController.getAll);
router.get('/militares/search', militarController.search);
router.post('/militares', ensureAdmin, validate(militarValidator.create), militarController.create);
router.put('/militares/:id', ensureAdmin, validate(militarValidator.update), militarController.update);
router.delete('/militares/:id', ensureAdmin, militarController.delete);
router.post('/militares/:id/toggle-active', ensureAdmin, militarController.toggleActive);

router.get('/medicos', medicoController.getAll);
router.get('/medicos/search', medicoController.search);
router.post('/medicos', ensureAdmin, medicoController.create);
router.put('/medicos/:id', ensureAdmin, medicoController.update);
router.delete('/medicos/:id', ensureAdmin, medicoController.delete);
router.post('/medicos/:id/toggle-active', ensureAdmin, medicoController.toggleActive);

router.get('/civis/search', escalaMedicoController.searchCivis);

router.get('/aeronaves', aeronaveController.getAll);
router.post('/aeronaves', ensureAdmin, validate(aeronaveValidator.create), aeronaveController.create);
router.put('/aeronaves/:id', ensureAdmin, validate(aeronaveValidator.update), aeronaveController.update);
router.delete('/aeronaves/:id', ensureAdmin, aeronaveController.delete);

router.get('/users', userController.getAll);
router.get('/users/pending', userController.getPending);
router.post('/users/:id/approve', ensureAdmin, userController.approve);
router.post('/users/:id/reject', ensureAdmin, userController.reject);
router.post('/users', ensureAdmin, validate(userValidator.create), userController.create);
router.put('/users/:id', ensureAdmin, validate(userValidator.update), userController.update);
router.delete('/users/:id', ensureAdmin, userController.delete);
router.post('/users/:id/toggle-active', ensureAdmin, userController.toggleActive);
router.put('/user/change-password', userController.changePassword);

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

router.get('/escala-aeronaves', escalaAeronaveController.getAll);
router.get('/escala-aeronaves/:id', escalaAeronaveController.getById);
router.post('/escala-aeronaves', ensureAdmin, validate(escalaAeronaveValidator.create), escalaAeronaveController.create);
router.put('/escala-aeronaves/:id', ensureAdmin, validate(escalaAeronaveValidator.update), escalaAeronaveController.update);
router.delete('/escala-aeronaves/:id', ensureAdmin, escalaAeronaveController.delete);

router.get('/escala-codec', escalaCodecController.getAll);
router.get('/escala-codec/:id', escalaCodecController.getById);
router.post('/escala-codec', ensureAdmin, validate(escalaCodecValidator.create), escalaCodecController.create);
router.put('/escala-codec/:id', ensureAdmin, validate(escalaCodecValidator.update), escalaCodecController.update);
router.delete('/escala-codec/:id', ensureAdmin, escalaCodecController.delete);

router.get('/escala-medicos', escalaMedicoController.getAll);
router.get('/escala-medicos/:id', escalaMedicoController.getById);
router.post('/escala-medicos', ensureAdmin, validate(escalaMedicoValidator.create), escalaMedicoController.create);
router.put('/escala-medicos/:id', ensureAdmin, validate(escalaMedicoValidator.update), escalaMedicoController.update);
router.delete('/escala-medicos/:id', ensureAdmin, escalaMedicoController.delete);

router.get('/escala', escalaController.getEscala);
router.put('/escala', ensureAdmin, escalaController.updateEscala);

router.get('/servico-dia', servicoDiaController.getServicoDia);
router.post('/servico-dia', ensureAdmin, servicoDiaController.updateServicoDia);
router.delete('/servico-dia', ensureAdmin, servicoDiaController.deleteServicoDia);

router.get('/relatorio/diario', relatorioController.getRelatorioDiario);
router.get('/relatorio-diario', relatorioController.getRelatorioDiario);
router.get('/metadata/:key', dashboardController.getMetadataByKey);

export default router;
