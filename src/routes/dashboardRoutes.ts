import path from 'path';
import { Router } from 'express';
const load = (relativePath: string) => {
  const mod = require(path.join(__dirname, relativePath));
  return mod?.default || mod;
};

const dashboardController = load('../controllers/dashboardController');
const obmController = load('../controllers/obmController');

const router = Router();

// Log de diagnóstico para verificar se o controller carregou corretamente
console.log('[dashboardRoutes] dashboardController keys:', Object.keys(dashboardController || {}));

// Helper para evitar crash caso algum handler não esteja disponível
const safeHandler = (controller: any, methodName: string) => {
  const fn = controller?.[methodName];
  if (typeof fn === 'function') return fn;
  console.error(`[dashboardRoutes] Handler ausente ou inválido: ${methodName}`);
  return (_req: any, res: any) => res.status(500).json({ message: `Handler indisponível: ${methodName}` });
};

// --- ROTAS DO DASHBOARD ---
router.get('/stats', safeHandler(dashboardController, 'getStats'));
router.get('/viatura-stats-por-tipo', safeHandler(dashboardController, 'getViaturaStatsPorTipo'));
router.get('/militar-stats', safeHandler(dashboardController, 'getMilitarStats'));
router.get('/viatura-stats-detalhado', safeHandler(dashboardController, 'getViaturaStatsDetalhado'));
router.get('/viatura-stats-por-obm', safeHandler(dashboardController, 'getViaturaStatsPorObm'));
router.get('/servico-dia', safeHandler(dashboardController, 'getServicoDia'));
router.get('/escala-aeronaves', safeHandler(dashboardController, 'getEscalaAeronaves'));
router.get('/escala-codec', safeHandler(dashboardController, 'getEscalaCodec'));
router.get('/militares-escalados-count', safeHandler(dashboardController, 'getMilitaresEscaladosCount'));
router.get('/metadata/:key', safeHandler(dashboardController, 'getMetadataByKey'));
router.get('/obms', obmController.getAll);

export default router;
