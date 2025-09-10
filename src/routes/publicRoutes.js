const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// --- ROTAS PÚBLICAS DE DASHBOARD ---
// Expõe os mesmos endpoints do dashboard, mas sem a proteção de login.

router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/viatura-stats-por-tipo', dashboardController.getViaturaStatsPorTipo);
router.get('/dashboard/militar-stats', dashboardController.getMilitarStats);
router.get('/dashboard/viatura-stats-detalhado', dashboardController.getViaturaStatsDetalhado);
router.get('/dashboard/viatura-stats-por-obm', dashboardController.getViaturaStatsPorObm);
router.get('/dashboard/servico-dia', dashboardController.getServicoDia);

module.exports = router;
