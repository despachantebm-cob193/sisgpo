import { Router } from 'express';
import comandantesCrbmController from '../controllers/comandantesCrbmController';

const router = Router();

// Rotas públicas ou protegidas conforme necessário
router.get('/', comandantesCrbmController.list);
router.get('/search-militares', comandantesCrbmController.searchMilitares);
router.get('/:id', comandantesCrbmController.getById);
router.post('/', comandantesCrbmController.create);
router.put('/:id', comandantesCrbmController.update);
router.delete('/:id', comandantesCrbmController.delete);

export default router;
