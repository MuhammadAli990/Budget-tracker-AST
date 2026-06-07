import { sendSuccess, sendError } from '../utils/response.js';
import {
    createBudget,
    getBudgetsByUser,
    updateBudget,
    deleteBudget,
} from '../services/budgetService.js';

export const create = async (req, res, next) => {
    try {
        const { amount, name } = req.body;
        const userId = req.user.userId;

        if (!amount || !name) {
            return sendError(res, 400, 'amount and name are required.');
        }

        const budget = await createBudget(req.db, userId, amount, name);
        return sendSuccess(res, 201, 'Budget created.', budget);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const budgets = await getBudgetsByUser(req.db, userId);
        return sendSuccess(res, 200, 'Budgets retrieved.', budgets);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, name } = req.body;
        const userId = req.user.userId;

        if (!amount && !name) {
            return sendError(res, 400, 'At least amount or name is required.');
        }

        const budget = await updateBudget(req.db, id, userId, { amount, name });
        return sendSuccess(res, 200, 'Budget updated.', budget);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await deleteBudget(req.db, id, userId);
        return sendSuccess(res, 200, 'Budget deleted.', {});
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};
