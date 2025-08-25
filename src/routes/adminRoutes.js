const express = require('express');
const router = express.Router();

// 1. Importa todos os controllers e middlewares necessários
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const plantaoController = require('../controllers/plantaoController');
const authMiddleware = require('../middlewares/authMiddleware');

// 2. Rota pública de login
router.post('/login', authController.login);

// --- ROTAS PROTEGIDAS ABAIXO ---
// 3. O middleware é aplicado a todas as rotas definidas daqui para baixo
router.use(authMiddleware);

// Rota de teste para verificar o middleware
router.get('/teste', (req, res) => {
  res.json({
    message: 'Você está autenticado!',
    user: { id: req.userId, perfil: req.userPerfil },
  });
});

// --- ROTAS DE MILITARES (CRUD COMPLETO) ---
router.get('/militares', militarController.getAll);
router.post('/militares', militarController.create);
router.put('/militares/:id', militarController.update);
router.delete('/militares/:id', militarController.delete);

// --- ROTAS DE OBMS (CRUD COMPLETO) ---
router.get('/obms', obmController.getAll);
router.post('/obms', obmController.create);
router.put('/obms/:id', obmController.update);
router.delete('/obms/:id', obmController.delete);

// --- ROTAS DE VIATURAS (CRUD COMPLETO) ---
router.get('/viaturas', viaturaController.getAll);
router.post('/viaturas', viaturaController.create);
router.put('/viaturas/:id', viaturaController.update);
router.delete('/viaturas/:id', viaturaController.delete);

// --- ROTAS DE PLANTÕES (CRUD COMPLETO) ---
router.post('/plantoes', plantaoController.create);
router.get('/plantoes', plantaoController.getAll);
router.get('/plantoes/:id', plantaoController.getById);
router.put('/plantoes/:id', plantaoController.update);
router.delete('/plantoes/:id', plantaoController.delete);


module.exports = router;
