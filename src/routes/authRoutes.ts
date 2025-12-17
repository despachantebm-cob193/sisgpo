import { Router } from 'express';
import authController from '../controllers/authController';
import { ssoAuthMiddleware } from '../middlewares/ssoAuthMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/google/callback', authController.googleLogin);
router.post('/sso-login', ssoAuthMiddleware, authController.ssoLogin);

export default router;
