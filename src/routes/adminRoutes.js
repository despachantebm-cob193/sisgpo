const express = require('express');
const router = express.Router();

// Importa os controllers e middlewares
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública de login (não passa pelo middleware abaixo)
router.post('/login', authController.login);

// --- ROTAS PROTEGIDAS ABAIXO ---
// O middleware é aplicado a todas as rotas definidas daqui para baixo
router.use(authMiddleware);

// Rota de teste para verificar o middleware
router.get('/teste', (req, res) => {
  res.json({
    message: 'Você está autenticado!',
    user: { id: req.userId, perfil: req.userPerfil },
  });
});

// --- ROTAS DE MILITARES (CRUD COMPLETO) ---

// GET /api/admin/militares - Lista todos os militares
router.get('/militares', militarController.getAll);

// POST /api/admin/militares - Cria um novo militar
router.post('/militares', militarController.create);

// PUT /api/admin/militares/:id - Atualiza um militar existente
router.put('/militares/:id', militarController.update);

// DELETE /api/admin/militares/:id - Exclui um militar
router.delete('/militares/:id', militarController.delete);


module.exports = router;
