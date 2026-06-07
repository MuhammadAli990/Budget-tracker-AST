import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as budgetController from '../controllers/budgetController.js';

const router = express.Router();

router.post('/', authMiddleware, budgetController.create);
router.get('/', authMiddleware, budgetController.getAll);
router.patch('/:id', authMiddleware, budgetController.update);
router.delete('/:id', authMiddleware, budgetController.remove);

export default router;
