import { Router } from 'express';
import estatisticasExternasController from '../controllers/estatisticasExternasController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.get('/dashboard-ocorrencias', authMiddleware as any, estatisticasExternasController.getDashboardOcorrencias);

export default router;
