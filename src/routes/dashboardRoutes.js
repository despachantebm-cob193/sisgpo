const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const obmController = require('../controllers/obmController');

const router = Router();

// --- ROTAS DO DASHBOARD ---
router.get('/stats', dashboardController.getStats);
router.get('/viatura-stats-por-tipo', dashboardController.getViaturaStatsPorTipo);
router.get('/militar-stats', dashboardController.getMilitarStats);
router.get('/viatura-stats-detalhado', dashboardController.getViaturaStatsDetalhado);
router.get('/viatura-stats-por-obm', dashboardController.getViaturaStatsPorObm);
router.get('/servico-dia', dashboardController.getServicoDia);
router.get('/escala-aeronaves', dashboardController.getEscalaAeronaves);
router.get('/escala-codec', dashboardController.getEscalaCodec);
router.get('/militares-escalados-count', dashboardController.getMilitaresEscaladosCount);
router.get('/metadata/:key', dashboardController.getMetadataByKey);
router.get('/obms', obmController.getAll);

module.exports = router;
