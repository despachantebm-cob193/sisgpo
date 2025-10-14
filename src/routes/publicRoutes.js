// src/routes/publicRoutes.js

const express = require('express');
const router = express.Router();

// Controlador original
const dashboardController = require('../controllers/dashboardController');

// 1. NOVO: Controlador de estatísticas externas
const estatisticasExternasController = require('../controllers/estatisticasExternasController');


// --- ROTAS PÚBLICAS DE DASHBOARD ORIGINAIS ---
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/viatura-stats-por-tipo', dashboardController.getViaturaStatsPorTipo);
router.get('/dashboard/militar-stats', dashboardController.getMilitarStats);
router.get('/dashboard/viatura-stats-detalhado', dashboardController.getViaturaStatsDetalhado);
router.get('/dashboard/viatura-stats-por-obm', dashboardController.getViaturaStatsPorObm);
router.get('/dashboard/servico-dia', dashboardController.getServicoDia);
router.get('/dashboard/escala-aeronaves', dashboardController.getEscalaAeronaves);
router.get('/dashboard/escala-codec', dashboardController.getEscalaCodec);

// --- NOVA ROTA DE INTEGRAÇÃO ---
// Esta é a rota que consome o novo controller
router.get('/estatisticas-externas', estatisticasExternasController.getDashboardData);


module.exports = router;