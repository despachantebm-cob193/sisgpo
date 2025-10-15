// api/src/routes/externalRoutes.ts

import { Router } from 'express';
import { getDashboardDataForSso } from '../controllers/dashboardController'; // Vamos criar esta função a seguir
import { ssoAuthMiddleware } from '../middleware/ssoAuthMiddleware';

const router = Router();

// Define a rota segura que o sisgpo irá consumir
router.get('/external/dashboard', ssoAuthMiddleware, getDashboardDataForSso);

export default router;