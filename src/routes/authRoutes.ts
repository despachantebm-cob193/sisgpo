import { Router } from 'express';
import authController from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/google/callback', authController.googleLogin);
router.get('/me', authMiddleware, authController.me);
router.post('/sso-login', authController.ssoLogin);

export default router;
