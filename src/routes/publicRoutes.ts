import path from 'path';
import { Router } from 'express';
import accessRequestController from '../controllers/accessRequestController';
import metricsController from '../controllers/metricsController';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dashboardController = require(path.join(__dirname, '..', 'controllers', 'dashboardController') as string);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const estatisticasExternasController = require(
  path.join(__dirname, '..', 'controllers', 'estatisticasExternasController') as string,
);

const router = Router();

const safeHandler = (controller: any, methodName: string) => {
  const fn = controller?.[methodName];
  if (typeof fn === 'function') return fn;
  console.error(`[publicRoutes] Handler ausente ou invalido: ${methodName}`);
  return (_req: any, res: any) => res.status(500).json({ message: `Handler indisponivel: ${methodName}` });
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

// Solicitação de acesso - verificação WhatsApp
router.post('/access-request/send-code', accessRequestController.sendCode);
router.post('/access-request/verify-code', accessRequestController.verifyCode);
router.post('/access-request/submit', accessRequestController.submitRequest);

// Coleta de Web Vitals
router.post('/vitals', metricsController.storeWebVital);

export default router;
