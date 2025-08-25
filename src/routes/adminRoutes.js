const express = require('express');
const router = express.Router();

// Importa os controllers e middlewares
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública de login
router.post('/login', authController.login);

// --- ROTAS PROTEGIDAS ABAIXO ---
router.use(authMiddleware);

// Rota de teste
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
// GET /api/admin/obms - Lista todas as OBMs
router.get('/obms', obmController.getAll);

// POST /api/admin/obms - Cria uma nova OBM
router.post('/obms', obmController.create);

// PUT /api/admin/obms/:id - Atualiza uma OBM existente
router.put('/obms/:id', obmController.update);

// DELETE /api/admin/obms/:id - Exclui uma OBM
router.delete('/obms/:id', obmController.delete);


module.exports = router;
