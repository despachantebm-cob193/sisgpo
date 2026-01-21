
import { Router } from 'express';
import testController from '../controllers/testController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();
const authHandler = authMiddleware as any;

router.get('/logs', authHandler, testController.getLogs);
router.post('/run', authHandler, testController.runTests);

export default router;
