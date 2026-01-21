import { Router } from 'express';
import authController from '../controllers/authController';
import { ssoAuthMiddleware } from '../middlewares/ssoAuthMiddleware';

const router = Router();

import authMiddleware from '../middlewares/authMiddleware';

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/sso-login', ssoAuthMiddleware, authController.ssoLogin);

export default router;
