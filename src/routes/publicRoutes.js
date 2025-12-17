// src/routes/publicRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');

// Carrega controllers a partir de __dirname (funciona em src e em dist)
const dashboardController = require(path.join(__dirname, '..', 'controllers', 'dashboardController'));
const estatisticasExternasController = require(path.join(__dirname, '..', 'controllers', 'estatisticasExternasController'));

console.log('[publicRoutes] dashboardController keys:', Object.keys(dashboardController || {}));
console.log('[publicRoutes] estatisticasExternasController keys:', Object.keys(estatisticasExternasController || {}));

const safeHandler = (controller, methodName) => {
  const fn = controller?.[methodName];
  if (typeof fn === 'function') return fn;
  console.error(`[publicRoutes] Handler ausente ou invalido: ${methodName}`);
  return (_req, res) => res.status(500).json({ message: `Handler indisponivel: ${methodName}` });
};

router.get('/dashboard/stats', safeHandler(dashboardController, 'getStats'));
router.get('/dashboard/viatura-stats-por-tipo', safeHandler(dashboardController, 'getViaturaStatsPorTipo'));
router.get('/dashboard/militar-stats', safeHandler(dashboardController, 'getMilitarStats'));
router.get('/dashboard/viatura-stats-detalhado', safeHandler(dashboardController, 'getViaturaStatsDetalhado'));
router.get('/dashboard/viatura-stats-por-obm', safeHandler(dashboardController, 'getViaturaStatsPorObm'));
router.get('/dashboard/servico-dia', safeHandler(dashboardController, 'getServicoDia'));
router.get('/dashboard/escala-aeronaves', safeHandler(dashboardController, 'getEscalaAeronaves'));
router.get('/dashboard/escala-codec', safeHandler(dashboardController, 'getEscalaCodec'));

router.get('/estatisticas-externas', safeHandler(estatisticasExternasController, 'getDashboardOcorrencias'));

module.exports = router;
