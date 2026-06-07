import { eq } from 'drizzle-orm';
import { transactions, expenses, budgets } from '../db/schema.js';

export const createTransaction = async (db, userId, name, amount, date, expenseId) => {
    const transactionAmount = parseInt(amount);

    if (Number.isNaN(transactionAmount) || transactionAmount <= 0) {
        throw {
            statusCode: 400,
            message: 'amount must be a positive integer.',
            data: {},
        };
    }

    return await db.transaction(async (tx) => {
        // Get expense
        const expenseResult = await tx
            .select({
                id: expenses.id,
                amount: expenses.amount,
                budgetId: expenses.budgetId,
            })
            .from(expenses)
            .where(eq(expenses.id, parseInt(expenseId)))
            .limit(1);

        if (expenseResult.length === 0) {
            throw {
                statusCode: 404,
                message: 'Expense not found.',
                data: {},
            };
        }

        // Get budget and verify ownership
        const budgetResult = await tx
            .select({
                id: budgets.id,
                amount: budgets.amount,
                userId: budgets.userId,
            })
            .from(budgets)
            .where(eq(budgets.id, expenseResult[0].budgetId))
            .limit(1);

        if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
            throw {
                statusCode: 403,
                message: 'Unauthorized.',
                data: {},
            };
        }

        // Check sufficient budget
        if (budgetResult[0].amount < transactionAmount) {
            throw {
                statusCode: 400,
                message: 'Insufficient budget amount.',
                data: {},
            };
        }

        // Create transaction
        const insertedTransactions = await tx
            .insert(transactions)
            .values({
                name: String(name).trim(),
                amount: transactionAmount,
                date: new Date(date),
                expenseId: parseInt(expenseId),
            })
            .returning({
                id: transactions.id,
                name: transactions.name,
                amount: transactions.amount,
                date: transactions.date,
                expenseId: transactions.expenseId,
            });

        // Update expense amount
        await tx
            .update(expenses)
            .set({ amount: expenseResult[0].amount + transactionAmount })
            .where(eq(expenses.id, parseInt(expenseId)));

        // Update budget amount
        await tx
            .update(budgets)
            .set({ amount: budgetResult[0].amount - transactionAmount })
            .where(eq(budgets.id, budgetResult[0].id));

        return insertedTransactions[0];
    });
};

export const getTransactionsByExpense = async (db, userId, expenseId) => {
    // Get expense with budget info
    const expenseResult = await db
        .select({
            id: expenses.id,
            budgetId: expenses.budgetId,
        })
        .from(expenses)
        .where(eq(expenses.id, parseInt(expenseId)))
        .limit(1);

    if (expenseResult.length === 0) {
        throw {
            statusCode: 404,
            message: 'Expense not found.',
            data: {},
        };
    }

    // Verify budget ownership
    const budgetResult = await db
        .select({ userId: budgets.userId })
        .from(budgets)
        .where(eq(budgets.id, expenseResult[0].budgetId))
        .limit(1);

    if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
        throw {
            statusCode: 403,
            message: 'Unauthorized.',
            data: {},
        };
    }

    return await db
        .select({
            id: transactions.id,
            name: transactions.name,
            amount: transactions.amount,
            date: transactions.date,
            expenseId: transactions.expenseId,
        })
        .from(transactions)
        .where(eq(transactions.expenseId, parseInt(expenseId)));
};

export const updateTransaction = async (db, userId, transactionId, updateData) => {
    if (!updateData.name && !updateData.amount && !updateData.date) {
        throw {
            statusCode: 400,
            message: 'At least one field (name, amount, date) is required.',
            data: {},
        };
    }

    return await db.transaction(async (tx) => {
        // Get transaction
        const transactionResult = await tx
            .select({
                id: transactions.id,
                name: transactions.name,
                amount: transactions.amount,
                date: transactions.date,
                expenseId: transactions.expenseId,
            })
            .from(transactions)
            .where(eq(transactions.id, parseInt(transactionId)))
            .limit(1);

        if (transactionResult.length === 0) {
            throw {
                statusCode: 404,
                message: 'Transaction not found.',
                data: {},
            };
        }

        // Get expense
        const expenseResult = await tx
            .select({
                id: expenses.id,
                amount: expenses.amount,
                budgetId: expenses.budgetId,
            })
            .from(expenses)
            .where(eq(expenses.id, transactionResult[0].expenseId))
            .limit(1);

        if (expenseResult.length === 0) {
            throw {
                statusCode: 404,
                message: 'Related expense not found.',
                data: {},
            };
        }

        // Get budget and verify ownership
        const budgetResult = await tx
            .select({
                id: budgets.id,
                amount: budgets.amount,
                userId: budgets.userId,
            })
            .from(budgets)
            .where(eq(budgets.id, expenseResult[0].budgetId))
            .limit(1);

        if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
            throw {
                statusCode: 403,
                message: 'Unauthorized.',
                data: {},
            };
        }

        // Calculate amount change
        const oldAmount = transactionResult[0].amount;
        const newAmount = updateData.amount !== undefined ? parseInt(updateData.amount) : oldAmount;

        if (Number.isNaN(newAmount) || newAmount <= 0) {
            throw {
                statusCode: 400,
                message: 'amount must be a positive integer.',
                data: {},
            };
        }

        const delta = newAmount - oldAmount;

        // Check if sufficient budget for increase
        if (delta > 0 && budgetResult[0].amount < delta) {
            throw {
                statusCode: 400,
                message: 'Insufficient budget amount for this update.',
                data: {},
            };
        }

        // Build update object
        const updateFields = {};
        if (updateData.name) updateFields.name = String(updateData.name).trim();
        if (updateData.amount !== undefined) updateFields.amount = newAmount;
        if (updateData.date) updateFields.date = new Date(updateData.date);

        // Update transaction
        const updatedTransactions = await tx
            .update(transactions)
            .set(updateFields)
            .where(eq(transactions.id, parseInt(transactionId)))
            .returning({
                id: transactions.id,
                name: transactions.name,
                amount: transactions.amount,
                date: transactions.date,
                expenseId: transactions.expenseId,
            });

        // Update amounts if necessary
        if (delta !== 0) {
            await tx
                .update(expenses)
                .set({ amount: expenseResult[0].amount + delta })
                .where(eq(expenses.id, expenseResult[0].id));

            await tx
                .update(budgets)
                .set({ amount: budgetResult[0].amount - delta })
                .where(eq(budgets.id, budgetResult[0].id));
        }

        return updatedTransactions[0];
    });
};

export const deleteTransaction = async (db, userId, transactionId) => {
    return await db.transaction(async (tx) => {
        // Get transaction
        const transactionResult = await tx
            .select({
                id: transactions.id,
                amount: transactions.amount,
                expenseId: transactions.expenseId,
            })
            .from(transactions)
            .where(eq(transactions.id, parseInt(transactionId)))
            .limit(1);

        if (transactionResult.length === 0) {
            throw {
                statusCode: 404,
                message: 'Transaction not found.',
                data: {},
            };
        }

        // Get expense
        const expenseResult = await tx
            .select({
                id: expenses.id,
                amount: expenses.amount,
                budgetId: expenses.budgetId,
            })
            .from(expenses)
            .where(eq(expenses.id, transactionResult[0].expenseId))
            .limit(1);

        if (expenseResult.length === 0) {
            throw {
                statusCode: 404,
                message: 'Related expense not found.',
                data: {},
            };
        }

        // Get budget and verify ownership
        const budgetResult = await tx
            .select({
                id: budgets.id,
                amount: budgets.amount,
                userId: budgets.userId,
            })
            .from(budgets)
            .where(eq(budgets.id, expenseResult[0].budgetId))
            .limit(1);

        if (budgetResult.length === 0 || budgetResult[0].userId !== userId) {
            throw {
                statusCode: 403,
                message: 'Unauthorized.',
                data: {},
            };
        }

        // Update expense
        await tx
            .update(expenses)
            .set({ amount: expenseResult[0].amount - transactionResult[0].amount })
            .where(eq(expenses.id, expenseResult[0].id));

        // Update budget
        await tx
            .update(budgets)
            .set({ amount: budgetResult[0].amount + transactionResult[0].amount })
            .where(eq(budgets.id, budgetResult[0].id));

        // Delete transaction
        await tx.delete(transactions).where(eq(transactions.id, parseInt(transactionId)));
    });
};
