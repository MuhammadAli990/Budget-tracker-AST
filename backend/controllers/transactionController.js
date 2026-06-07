import { sendSuccess, sendError } from '../utils/response.js';
import {
    createTransaction,
    getTransactionsByExpense,
    updateTransaction,
    deleteTransaction,
} from '../services/transactionService.js';

export const create = async (req, res, next) => {
    try {
        const { name, amount, date, expenseId } = req.body;
        const userId = req.user.userId;

        if (!name || !amount || !date || !expenseId) {
            return sendError(res, 400, 'name, amount, date and expenseId are required.');
        }

        const transaction = await createTransaction(req.db, userId, name, amount, date, expenseId);
        return sendSuccess(res, 201, 'Transaction created.', transaction);
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const { expenseId } = req.query;
        const userId = req.user.userId;

        if (!expenseId) {
            return sendError(res, 400, 'expenseId is required.');
        }

        const transactions = await getTransactionsByExpense(req.db, userId, expenseId);
        return sendSuccess(res, 200, 'Transactions retrieved.', transactions);
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
        const { name, amount, date } = req.body;
        const userId = req.user.userId;

        const transaction = await updateTransaction(req.db, userId, id, { name, amount, date });
        return sendSuccess(res, 200, 'Transaction updated.', transaction);
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

        await deleteTransaction(req.db, userId, id);
        return sendSuccess(res, 200, 'Transaction deleted.', {});
    } catch (error) {
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message, error.data);
        }
        next(error);
    }
};
