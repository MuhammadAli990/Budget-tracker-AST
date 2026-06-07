import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as transactionController from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', authMiddleware, transactionController.create);
router.get('/', authMiddleware, transactionController.getAll);
router.patch('/:id', authMiddleware, transactionController.update);
router.delete('/:id', authMiddleware, transactionController.remove);

export default router;
