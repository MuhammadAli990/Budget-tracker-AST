import { sendSuccess, sendError } from '../utils/response.js';
import {
    createExpense,
    getExpensesByBudget,
    updateExpense,
    deleteExpense,
} from '../services/expenseService.js';

export const create = async (req, res, next) => {
    try {
        const { budgetId, name } = req.body;
        const userId = req.user.userId;

        if (!budgetId || !name) {
            return sendError(res, 400, 'budgetId and name are required.');
        }

        const expense = await createExpense(req.db, userId, budgetId, name);
        return sendSuccess(res, 201, 'Expense created.', expense);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const { budgetId } = req.query;
        const userId = req.user.userId;

        if (!budgetId) {
            return sendError(res, 400, 'budgetId is required.');
        }

        const expenses = await getExpensesByBudget(req.db, userId, budgetId);
        return sendSuccess(res, 200, 'Expenses retrieved.', expenses);
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
        const { name } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return sendError(res, 400, 'name is required.');
        }

        const expense = await updateExpense(req.db, userId, id, name);
        return sendSuccess(res, 200, 'Expense updated.', expense);
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

        await deleteExpense(req.db, userId, id);
        return sendSuccess(res, 200, 'Expense deleted.', {});
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};
