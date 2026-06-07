import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

router.post('/', authMiddleware, expenseController.create);
router.get('/', authMiddleware, expenseController.getAll);
router.patch('/:id', authMiddleware, expenseController.update);
router.delete('/:id', authMiddleware, expenseController.remove);

export default router;
