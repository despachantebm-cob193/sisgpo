const express = require('express');
const router = express.Router();

// Importa os controllers e middlewares
const authController = require('../controllers/authController');
const militarController = require('../controllers/militarController');
const obmController = require('../controllers/obmController');
const viaturaController = require('../controllers/viaturaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública de login
router.post('/login', authController.login);

// --- ROTAS PROTEGIDAS ABAIXO ---
router.use(authMiddleware);

// ... (demais rotas de teste, militares e obms)

// --- ROTAS DE VIATURAS (CRUD COMPLETO) ---
// GET /api/admin/viaturas - Lista todas as viaturas
router.get('/viaturas', viaturaController.getAll);

// POST /api/admin/viaturas - Cadastra uma nova viatura
router.post('/viaturas', viaturaController.create);

// PUT /api/admin/viaturas/:id - Atualiza uma viatura existente
router.put('/viaturas/:id', viaturaController.update);

// DELETE /api/admin/viaturas/:id - Exclui uma viatura
router.delete('/viaturas/:id', viaturaController.delete);


module.exports = router;
